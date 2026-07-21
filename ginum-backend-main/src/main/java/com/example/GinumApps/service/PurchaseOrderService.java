package com.example.GinumApps.service;

import com.example.GinumApps.dto.*;
import com.example.GinumApps.enums.AccountType;
import com.example.GinumApps.enums.JournalEntryType;
import com.example.GinumApps.enums.LineItemType;
import com.example.GinumApps.enums.PurchaseType;
import com.example.GinumApps.exception.ResourceNotFoundException;
import com.example.GinumApps.model.*;
import com.example.GinumApps.repository.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private final CompanyRepository companyRepository;
    private final PurchaseOrderRepository purchaseOrderRepo;
    private final SupplierRepository supplierRepo;
    private final AccountRepository accountRepo;
    private final JournalEntryService journalEntryService;
    private final ItemRepository itemRepository;
    private final ProjectRepository projectRepo;
    private final AgingPayableSnapshotRepository agingRepo;
    private final TransactionRepository transactionRepo;

    @Transactional
    public List<PurchaseOrderResponseDto> getPurchaseOrdersByCompany(Integer companyId) {
        return purchaseOrderRepo.findByCompany_CompanyId(companyId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public PurchaseOrderResponseDto createPurchaseOrder(
            PurchaseOrderRequestDto request,
            Integer companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        Supplier supplier = supplierRepo.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));

        if (!supplier.getCompany().getCompanyId().equals(companyId)) {
            throw new AccessDeniedException("Supplier does not belong to your company");
        }

        BigDecimal amountPaid = BigDecimal.ZERO;
        Account paymentAccount = null;

        PurchaseOrder po = new PurchaseOrder();
        po.setSupplier(supplier);
        po.setCompany(company);
        po.setSupplierInvoiceNumber(request.getSupplierInvoiceNumber());
        po.setPoNumber(request.getPoNumber());
        po.setIssueDate(request.getIssueDate());
        po.setDueDate(request.getPromiseDate() != null ? request.getPromiseDate() : request.getDueDate());
        po.setPromiseDate(request.getPromiseDate());
        po.setNotes(request.getNotes());
        po.setPaymentAccount(paymentAccount);
        po.setAmountPaid(amountPaid);
        po.setPurchaseType(request.getPurchaseType());
        po.setFreight(valueOrZero(request.getFreight()));
        po.setTaxAmount(valueOrZero(request.getTaxAmount()));

        processItems(request.getItems(), po, company, request.getPurchaseType());
        calculateFinancials(po);

        PurchaseOrder savedPO = purchaseOrderRepo.save(po);

        // Update inventory stock and purchase price for GOODS items
        for (PurchaseOrderLineItem lineItem : savedPO.getItems()) {
            if (lineItem.getItemType() == LineItemType.GOODS && lineItem.getItem() != null) {
                Item item = lineItem.getItem();
                BigDecimal currentStock = item.getCurrentStock() != null ? item.getCurrentStock() : BigDecimal.ZERO;
                BigDecimal quantity = BigDecimal.valueOf(lineItem.getQuantity());
                item.setCurrentStock(currentStock.add(quantity));
                
                // Update the item's purchase price to the latest cost
                if (lineItem.getUnitPrice() != null && lineItem.getUnitPrice().compareTo(BigDecimal.ZERO) > 0) {
                    item.setPurchasePrice(lineItem.getUnitPrice());
                }

                itemRepository.save(item);
            }
        }

        createJournalEntries(savedPO);

        if (savedPO.getBalanceDue().compareTo(BigDecimal.ZERO) > 0) {
            createAgingSnapshot(savedPO);
        }

        return convertToDto(savedPO);
    }

    private void processItems(
            List<PurchaseOrderItemRequestDto> items,
            PurchaseOrder po,
            Company company,
            PurchaseType purchaseType) {
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("Purchase order must have at least one line item");
        }

        for (PurchaseOrderItemRequestDto itemRequest : items) {
            Account account = accountRepo.findByAccountCodeAndCompany_CompanyId(
                    itemRequest.getAccountCode(),
                    company.getCompanyId()).orElseThrow(
                            () -> new EntityNotFoundException("Account not found: " + itemRequest.getAccountCode()));

            Item item = null;

            if (purchaseType == PurchaseType.GOODS) {
                if (itemRequest.getItemId() == null) {
                    throw new IllegalArgumentException("Item is required for goods purchase");
                }

                item = itemRepository.findByItemIdAndCompany_CompanyId(
                        itemRequest.getItemId(),
                        company.getCompanyId())
                        .orElseThrow(() -> new EntityNotFoundException("Item not found: " + itemRequest.getItemId()));
            }

            Project project = null;

            if (itemRequest.getProjectId() != null) {
                project = projectRepo.findById(itemRequest.getProjectId())
                        .orElseThrow(
                                () -> new EntityNotFoundException("Project not found: " + itemRequest.getProjectId()));

                if (!project.getCompany().getCompanyId().equals(company.getCompanyId())) {
                    throw new AccessDeniedException("Project does not belong to your company");
                }
            }

            Integer quantity = itemRequest.getQuantity() != null
                    ? itemRequest.getQuantity()
                    : 1;

            BigDecimal unitPrice;

            if (purchaseType == PurchaseType.SERVICES) {
                unitPrice = valueOrZero(itemRequest.getAmount());
            } else {
                unitPrice = valueOrZero(itemRequest.getUnitPrice());
            }

            BigDecimal discountPercent = itemRequest.getDiscount() != null
                    ? itemRequest.getDiscount()
                    : BigDecimal.ZERO;

            BigDecimal lineAmount = unitPrice
                    .multiply(BigDecimal.valueOf(quantity))
                    .multiply(BigDecimal.ONE.subtract(
                            discountPercent.divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)));

            PurchaseOrderLineItem lineItem = new PurchaseOrderLineItem();
            lineItem.setPurchaseOrder(po);
            lineItem.setItem(item);
            lineItem.setDescription(itemRequest.getDescription());
            lineItem.setQuantity(quantity);
            lineItem.setUnitPrice(unitPrice);
            lineItem.setDiscountPercent(discountPercent);
            lineItem.setAmount(lineAmount);
            lineItem.setAccount(account);
            lineItem.setProject(project);
            lineItem.setItemType(
                    purchaseType == PurchaseType.GOODS
                            ? LineItemType.GOODS
                            : LineItemType.SERVICE);

            po.getItems().add(lineItem);
        }
    }

    private void calculateFinancials(PurchaseOrder po) {
        BigDecimal subtotal = po.getItems()
                .stream()
                .map(item -> item.getAmount() != null ? item.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        po.setSubtotal(subtotal);

        BigDecimal freight = valueOrZero(po.getFreight());
        BigDecimal tax = valueOrZero(po.getTaxAmount());
        BigDecimal paid = valueOrZero(po.getAmountPaid());

        po.setTotal(subtotal.add(freight).add(tax));
        po.setBalanceDue(po.getTotal().subtract(paid));

        if (po.getBalanceDue().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalStateException("Overpayment detected");
        }
    }

    private void createJournalEntries(PurchaseOrder po) {
        Company company = po.getCompany();
        Account apAccount = company.getAccountsPayableAccount();
        if (apAccount == null) {
            apAccount = accountRepo.findByAccountCodeAndCompany_CompanyId("2100", company.getCompanyId())
                    .orElseGet(() -> {
                        Account newAp = new Account();
                        newAp.setAccountName("Accounts Payable");
                        newAp.setNormalizedName("ACCOUNTSPAYABLE");
                        newAp.setSubAccountName("");
                        newAp.setAccountType(AccountType.LIABILITY_ACCOUNTS_PAYABLE);
                        newAp.setCurrentBalance(BigDecimal.ZERO);
                        newAp.setCompany(company);
                        newAp.setAccountCode("2100");
                        return accountRepo.save(newAp);
                    });
            company.setAccountsPayableAccount(apAccount);
            companyRepository.save(company);
            po.setCompany(company);
        }

        JournalEntryDto entryDto = new JournalEntryDto();
        entryDto.setLines(new ArrayList<>());

        entryDto.setEntryType(JournalEntryType.PURCHASE);
        entryDto.setEntryDate(po.getIssueDate());
        entryDto.setJournalTitle("Purchase Journal");
        entryDto.setReferenceNo(po.getSupplierInvoiceNumber());
        entryDto.setCompanyId(po.getCompany().getCompanyId());
        entryDto.setDescription("Purchase order #" + po.getId());

        for (PurchaseOrderLineItem item : po.getItems()) {
            BigDecimal lineTotal = item.getAmount() != null
                    ? item.getAmount()
                    : BigDecimal.ZERO;

            entryDto.getLines().add(new JournalEntryLineDto(
                    item.getAccount().getAccountCode(),
                    lineTotal,
                    true,
                    item.getDescription()));
        }

        if (po.getFreight().compareTo(BigDecimal.ZERO) > 0 &&
                po.getCompany().getFreightAccount() != null) {
            entryDto.getLines().add(new JournalEntryLineDto(
                    po.getCompany().getFreightAccount().getAccountCode(),
                    po.getFreight(),
                    true,
                    "Freight charges"));
        }

        if (po.getTaxAmount().compareTo(BigDecimal.ZERO) > 0 &&
                po.getCompany().getTaxAccount() != null) {
            entryDto.getLines().add(new JournalEntryLineDto(
                    po.getCompany().getTaxAccount().getAccountCode(),
                    po.getTaxAmount(),
                    true,
                    "Purchase tax"));
        }

        if (po.getAmountPaid().compareTo(BigDecimal.ZERO) > 0 &&
                po.getPaymentAccount() != null) {
            entryDto.getLines().add(new JournalEntryLineDto(
                    po.getPaymentAccount().getAccountCode(),
                    po.getAmountPaid(),
                    false,
                    "Payment for PO #" + po.getId()));
        }

        if (po.getBalanceDue().compareTo(BigDecimal.ZERO) > 0 &&
                po.getCompany().getAccountsPayableAccount() != null) {
            entryDto.getLines().add(new JournalEntryLineDto(
                    po.getCompany().getAccountsPayableAccount().getAccountCode(),
                    po.getBalanceDue(),
                    false,
                    "Payable to " + po.getSupplier().getSupplierName()));
        }

        journalEntryService.createJournalEntry(entryDto);
    }

    private void createAgingSnapshot(PurchaseOrder po) {
        AgingPayableSnapshot snapshot = new AgingPayableSnapshot();
        snapshot.setCompany(po.getCompany());
        snapshot.setSupplier(po.getSupplier());
        snapshot.setPoNumber(po.getPoNumber());
        snapshot.setDueDate(po.getDueDate());
        snapshot.setBalanceDue(po.getBalanceDue());
        snapshot.setSnapshotDate(LocalDate.now());
        snapshot.computeBuckets(LocalDate.now());

        agingRepo.save(snapshot);
    }

    @Transactional
    public void payPurchaseOrder(Long poId, PurchasePaymentRequestDto request) {
        PurchaseOrder po = purchaseOrderRepo.findById(poId)
                .orElseThrow(() -> new EntityNotFoundException("Purchase order not found"));

        if (!po.getCompany().getCompanyId().equals(request.getCompanyId())) {
            throw new AccessDeniedException("Access denied to this purchase order");
        }

        if (po.getBalanceDue().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Purchase order is already fully paid");
        }

        if (request.getAmount().compareTo(po.getBalanceDue()) > 0) {
            throw new IllegalArgumentException("Payment amount exceeds balance due");
        }

        Account paymentAccount = accountRepo.findByAccountCodeAndCompany_CompanyId(
                request.getPaymentAccountCode(),
                request.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid payment account code"));

        po.setAmountPaid(po.getAmountPaid().add(request.getAmount()));
        po.setBalanceDue(po.getBalanceDue().subtract(request.getAmount()));

        PurchaseOrder savedPO = purchaseOrderRepo.save(po);

        Transaction transaction = new Transaction();
        transaction.setReferenceNumber(po.getPoNumber());
        transaction.setDate(LocalDate.now().toString());
        transaction.setDescription(
                "Spend Money - " + po.getSupplier().getSupplierName() + " (PO: " + po.getPoNumber() + ")");
        transaction.setTotalDebit(0.0);
        transaction.setTotalCredit(request.getAmount().doubleValue());
        transaction.setCompany(po.getCompany());

        transaction.setPayeeType("Supplier");
        transaction.setPayeeId(po.getSupplier().getId().intValue());
        transaction.setPayeeName(po.getSupplier().getSupplierName());
        transaction.setPaymentCategory("Supplier Payment");
        transaction.setPaymentMethod("Bank Transfer");
        transaction.setPaymentAccountCode(request.getPaymentAccountCode());

        transactionRepo.save(transaction);

        if (savedPO.getBalanceDue().compareTo(BigDecimal.ZERO) > 0) {
            createAgingSnapshot(savedPO);
        }

        if (po.getCompany().getAccountsPayableAccount() != null) {
            JournalEntryDto journal = new JournalEntryDto();
            journal.setEntryType(JournalEntryType.PAYMENT);
            journal.setEntryDate(LocalDate.now());
            journal.setJournalTitle("PO Payment");
            journal.setReferenceNo(po.getSupplierInvoiceNumber());
            journal.setCompanyId(request.getCompanyId());
            journal.setDescription("Payment for PO #" + po.getId());

            List<JournalEntryLineDto> lines = new ArrayList<>();

            lines.add(new JournalEntryLineDto(
                    paymentAccount.getAccountCode(),
                    request.getAmount(),
                    false,
                    "Payment from account for PO"));

            lines.add(new JournalEntryLineDto(
                    po.getCompany().getAccountsPayableAccount().getAccountCode(),
                    request.getAmount(),
                    true,
                    "Reduce payable for PO"));

            journal.setLines(lines);
            journalEntryService.createJournalEntry(journal);
        }
    }

    private PurchaseOrderResponseDto convertToDto(PurchaseOrder po) {
        PurchaseOrderResponseDto dto = new PurchaseOrderResponseDto();

        dto.setId(po.getId());
        dto.setPurchaseOrderNumber(po.getPoNumber());
        dto.setSupplierId(po.getSupplier().getId());
        dto.setSupplierName(po.getSupplier().getSupplierName());
        dto.setSupplierInvoiceNumber(po.getSupplierInvoiceNumber());
        dto.setIssueDate(po.getIssueDate());
        dto.setPromiseDate(po.getPromiseDate());
        dto.setNotes(po.getNotes());
        dto.setSubtotal(po.getSubtotal());
        dto.setFreight(po.getFreight());
        dto.setTaxAmount(po.getTaxAmount());
        dto.setTotal(po.getTotal());
        dto.setAmountPaid(po.getAmountPaid());
        dto.setBalanceDue(po.getBalanceDue());
        dto.setPurchaseType(po.getPurchaseType());

        dto.setItems(
                po.getItems()
                        .stream()
                        .map(this::convertItemToDto)
                        .collect(Collectors.toList()));

        return dto;
    }

    private PurchaseOrderItemResponseDto convertItemToDto(PurchaseOrderLineItem item) {
        PurchaseOrderItemResponseDto itemDto = new PurchaseOrderItemResponseDto();

        if (item.getItem() != null) {
            itemDto.setItemId(item.getItem().getItemId());
            itemDto.setItemName(item.getItem().getName());
        }

        itemDto.setDescription(item.getDescription());
        itemDto.setQuantity(item.getQuantity() != null ? item.getQuantity() : 1);
        itemDto.setUnitPrice(item.getUnitPrice());
        itemDto.setDiscountPercent(item.getDiscountPercent());
        itemDto.setAmount(item.getAmount());
        itemDto.setAccountCode(item.getAccount() != null ? item.getAccount().getAccountCode() : null);
        itemDto.setProjectId(item.getProject() != null ? item.getProject().getId() : null);
        itemDto.setItemType(item.getItemType());

        return itemDto;
    }

    private BigDecimal valueOrZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}