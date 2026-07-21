package com.example.GinumApps.service;

import com.example.GinumApps.dto.ItemDto;
import com.example.GinumApps.dto.StockUpdateDto;
import com.example.GinumApps.enums.StockTransactionType;
import com.example.GinumApps.exception.ResourceNotFoundException;
import com.example.GinumApps.model.Company;
import com.example.GinumApps.model.Item;
import com.example.GinumApps.model.StockTransaction;
import com.example.GinumApps.repository.CompanyRepository;
import com.example.GinumApps.repository.ItemRepository;
import com.example.GinumApps.repository.StockTransactionRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;
    private final CompanyRepository companyRepository;
    private final StockTransactionRepository stockTransactionRepository;

    @Transactional
    public ItemDto createItem(Integer companyId, ItemDto itemDto) {
        Company company = getCompany(companyId);

        if (itemDto.getItemCode() != null && !itemDto.getItemCode().isBlank()) {
            if (itemRepository.existsByItemCodeIgnoreCaseAndCompany_CompanyId(
                    itemDto.getItemCode().trim(),
                    companyId
            )) {
                throw new IllegalArgumentException("Item code already exists for this company");
            }
        }

        Item item = new Item();
        item.setCompany(company);
        item.setItemCode(clean(itemDto.getItemCode()));
        item.setName(clean(itemDto.getName()));
        item.setCategory(clean(itemDto.getCategory()));
        item.setItemType(itemDto.getItemType());
        item.setDescription(clean(itemDto.getDescription()));
        item.setPurchasePrice(valueOrZero(itemDto.getPurchasePrice()));
        item.setUnitPrice(valueOrZero(itemDto.getUnitPrice()));
        item.setCurrentStock(valueOrZero(itemDto.getCurrentStock()));
        item.setReorderLevel(valueOrZero(itemDto.getReorderLevel()));
        item.setUnit(clean(itemDto.getUnit()));
        item.setActive(true);

        Item savedItem = itemRepository.save(item);

        if (savedItem.getCurrentStock().compareTo(BigDecimal.ZERO) > 0) {
            saveStockTransaction(
                    company,
                    savedItem,
                    StockTransactionType.STOCK_IN,
                    savedItem.getCurrentStock(),
                    "Opening stock"
            );
        }

        return toDto(savedItem);
    }

    public List<ItemDto> getItemsByCompany(Integer companyId) {
        return itemRepository.findByCompany_CompanyId(companyId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ItemDto updateItem(Integer companyId, Long itemId, ItemDto itemDto) {
        Item item = getItem(companyId, itemId);

        if (itemDto.getItemCode() != null && !itemDto.getItemCode().isBlank()) {
            if (itemRepository.existsByItemCodeIgnoreCaseAndCompany_CompanyIdAndItemIdNot(
                    itemDto.getItemCode().trim(),
                    companyId,
                    itemId
            )) {
                throw new IllegalArgumentException("Item code already exists for this company");
            }
        }

        item.setItemCode(clean(itemDto.getItemCode()));
        item.setName(clean(itemDto.getName()));
        item.setCategory(clean(itemDto.getCategory()));
        item.setItemType(itemDto.getItemType());
        item.setDescription(clean(itemDto.getDescription()));
        item.setPurchasePrice(valueOrZero(itemDto.getPurchasePrice()));
        item.setUnitPrice(valueOrZero(itemDto.getUnitPrice()));
        item.setReorderLevel(valueOrZero(itemDto.getReorderLevel()));
        item.setUnit(clean(itemDto.getUnit()));

        if (itemDto.getActive() != null) {
            item.setActive(itemDto.getActive());
        }

        Item updatedItem = itemRepository.save(item);
        return toDto(updatedItem);
    }

    @Transactional
    public void deleteItem(Integer companyId, Long itemId) {
        Item item = getItem(companyId, itemId);

        long stockUsage = itemRepository.countStockUsage(itemId);
        long salesUsage = itemRepository.countSalesUsage(itemId);
        long purchaseUsage = itemRepository.countPurchaseUsage(itemId);

        boolean isUsed = (stockUsage > 0 || salesUsage > 0 || purchaseUsage > 0);

        if (isUsed) {
            throw new IllegalStateException("This item is already used in transactions and cannot be deleted. You can deactivate it instead.");
        }

        // Hard delete
        stockTransactionRepository.deleteByItem_ItemId(itemId);
        itemRepository.delete(item);
    }

    @Transactional
    public ItemDto updateItemActiveStatus(Integer companyId, Long itemId, Boolean active) {
        Item item = getItem(companyId, itemId);
        item.setActive(active);
        Item savedItem = itemRepository.save(item);
        return toDto(savedItem);
    }

    @Transactional
    public ItemDto addStock(Integer companyId, Long itemId, StockUpdateDto dto) {
        Company company = getCompany(companyId);
        Item item = getItem(companyId, itemId);

        BigDecimal qty = dto.getQuantity();

        item.setCurrentStock(valueOrZero(item.getCurrentStock()).add(qty));
        Item savedItem = itemRepository.save(item);

        saveStockTransaction(
                company,
                savedItem,
                StockTransactionType.STOCK_IN,
                qty,
                dto.getNotes()
        );

        return toDto(savedItem);
    }

    @Transactional
    public ItemDto reduceStock(Integer companyId, Long itemId, StockUpdateDto dto) {
        Company company = getCompany(companyId);
        Item item = getItem(companyId, itemId);

        BigDecimal currentStock = valueOrZero(item.getCurrentStock());
        BigDecimal qty = dto.getQuantity();

        if (qty.compareTo(currentStock) > 0) {
            throw new IllegalArgumentException("Cannot reduce more than current stock");
        }

        item.setCurrentStock(currentStock.subtract(qty));
        Item savedItem = itemRepository.save(item);

        saveStockTransaction(
                company,
                savedItem,
                StockTransactionType.STOCK_OUT,
                qty,
                dto.getNotes()
        );

        return toDto(savedItem);
    }

    private Company getCompany(Integer companyId) {
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
    }

    private Item getItem(Integer companyId, Long itemId) {
        return itemRepository.findByItemIdAndCompany_CompanyId(itemId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));
    }

    private void saveStockTransaction(
            Company company,
            Item item,
            StockTransactionType type,
            BigDecimal quantity,
            String notes
    ) {
        StockTransaction transaction = new StockTransaction();
        transaction.setCompany(company);
        transaction.setItem(item);
        transaction.setTransactionType(type);
        transaction.setQuantity(quantity);
        transaction.setNotes(notes);

        stockTransactionRepository.save(transaction);
    }

    private BigDecimal valueOrZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private Integer valueOrZero(Integer value) {
        return value == null ? 0 : value;
    }

    private String clean(String value) {
        return value == null ? null : value.trim();
    }

    private ItemDto toDto(Item item) {
        return ItemDto.builder()
                .itemId(item.getItemId())
                .itemCode(item.getItemCode())
                .name(item.getName())
                .category(item.getCategory())
                .itemType(item.getItemType())
                .description(item.getDescription())
                .purchasePrice(item.getPurchasePrice())
                .unitPrice(item.getUnitPrice())
                .currentStock(item.getCurrentStock())
                .reorderLevel(item.getReorderLevel())
                .unit(item.getUnit())
                .active(item.getActive())
                .build();
    }
}