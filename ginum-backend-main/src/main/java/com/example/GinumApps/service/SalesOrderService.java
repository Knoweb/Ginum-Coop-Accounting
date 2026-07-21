package com.example.GinumApps.service;

import com.example.GinumApps.dto.*;
import com.example.GinumApps.enums.AccountType;
import com.example.GinumApps.enums.JournalEntryType;
import com.example.GinumApps.enums.LineItemType;
import com.example.GinumApps.enums.SalesType;
import com.example.GinumApps.exception.ResourceNotFoundException;
import com.example.GinumApps.model.*;
import com.example.GinumApps.repository.*;
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
public class SalesOrderService {

    private final CompanyRepository companyRepo;
    private final CustomerRepository customerRepo;
    private final SalesOrderRepository salesOrderRepo;
    private final AccountRepository accountRepo;
    private final ItemRepository itemRepo;
    private final ProjectRepository projectRepo;
    private final JournalEntryService journalService;
    private final AgingReceivableSnapshotRepository agingReceivableSnapshotRepo;
    private final TransactionRepository transactionRepo;

    @Transactional
    public SalesOrderResponseDto createSalesOrder(SalesOrderRequestDto request, Integer companyId) {
        Company company = companyRepo.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        Customer customer = customerRepo.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        if (!customer.getCompany().getCompanyId().equals(companyId)) {
            throw new AccessDeniedException("Customer does not belong to your company");
        }

        Account paymentAccount = null;
        BigDecimal amountPaid = BigDecimal.ZERO;

        SalesOrder order = new SalesOrder();
        order.setCompany(company);
        order.setCustomer(customer);
        order.setSoNumber(request.getSoNumber());
        order.setIssueDate(request.getIssueDate());
        order.setDueDate(request.getDueDate());
        order.setNotes(request.getNotes());
        order.setPaymentAccount(null);
        order.setAmountPaid(BigDecimal.ZERO);
        order.setSalesType(request.getSalesType());

        processItems(request.getItems(), order, company, request.getSalesType());
        calculateFinancials(order);

        SalesOrder savedOrder = salesOrderRepo.save(order);

        // Keep this only if your company has Accounts Receivable account configured.
        createJournalEntries(savedOrder);

        if (savedOrder.getBalanceDue().compareTo(BigDecimal.ZERO) > 0) {
            createAgingReceivableSnapshot(savedOrder);
        }

        return convertToDto(savedOrder);
    }

    private void processItems(
            List<SalesOrderItemRequestDto> items,
            SalesOrder order,
            Company company,
            SalesType salesType
    ) {
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("Sales order must have at least one item");
        }

        for (SalesOrderItemRequestDto itemRequest : items) {
            Account account = accountRepo.findByAccountCodeAndCompany_CompanyId(
                    itemRequest.getAccountCode(),
                    company.getCompanyId()
            ).orElseThrow(() ->
                    new ResourceNotFoundException("Account not found: " + itemRequest.getAccountCode())
            );

            Item item = null;

            if (salesType == SalesType.GOODS) {
                if (itemRequest.getItemId() == null) {
                    throw new IllegalArgumentException("Item is required for goods sales");
                }

                item = itemRepo.findByItemIdAndCompany_CompanyId(
                        itemRequest.getItemId(),
                        company.getCompanyId()
                ).orElseThrow(() ->
                        new ResourceNotFoundException("Item not found: " + itemRequest.getItemId())
                );
                
                Integer quantity = itemRequest.getQuantity() != null ? itemRequest.getQuantity() : 1;
                BigDecimal qtyDecimal = BigDecimal.valueOf(quantity);
                BigDecimal currentStock = item.getCurrentStock() != null ? item.getCurrentStock() : BigDecimal.ZERO;
                
                if (currentStock.compareTo(qtyDecimal) < 0) {
                    throw new IllegalArgumentException("Insufficient stock for item: " + item.getName());
                }
                
                item.setCurrentStock(currentStock.subtract(qtyDecimal));
                itemRepo.save(item);
            }

            Project project = null;

            if (itemRequest.getProjectId() != null) {
                project = projectRepo.findById(itemRequest.getProjectId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException("Project not found: " + itemRequest.getProjectId())
                        );

                if (!project.getCompany().getCompanyId().equals(company.getCompanyId())) {
                    throw new AccessDeniedException("Project does not belong to your company");
                }
            }

            Integer quantity = itemRequest.getQuantity() != null
                    ? itemRequest.getQuantity()
                    : 1;

            BigDecimal unitPrice = valueOrZero(itemRequest.getUnitPrice());

            BigDecimal discountPercent = itemRequest.getDiscountPercent() != null
                    ? itemRequest.getDiscountPercent()
                    : BigDecimal.ZERO;

            BigDecimal lineAmount = unitPrice
                    .multiply(BigDecimal.valueOf(quantity))
                    .multiply(BigDecimal.ONE.subtract(
                            discountPercent.divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                    ));

            SalesOrderLineItem line = new SalesOrderLineItem();
            line.setSalesOrder(order);
            line.setItem(item);
            line.setDescription(itemRequest.getDescription());
            line.setQuantity(quantity);
            line.setUnitPrice(unitPrice);
            line.setDiscountPercent(discountPercent);
            line.setAccount(account);
            line.setProject(project);
            line.setAmount(lineAmount);

            if (itemRequest.getItemType() != null) {
                line.setItemType(itemRequest.getItemType());
            } else {
                line.setItemType(salesType == SalesType.GOODS ? LineItemType.GOODS : LineItemType.SERVICE);
            }

            order.getItems().add(line);
        }
    }

    private void calculateFinancials(SalesOrder order) {
        BigDecimal subtotal = order.getItems().stream()
                .map(item -> item.getAmount() != null ? item.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        order.setSubtotal(subtotal);
        order.setTotal(subtotal);

        BigDecimal paid = valueOrZero(order.getAmountPaid());
        order.setBalanceDue(order.getTotal().subtract(paid));

        if (order.getBalanceDue().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalStateException("Overpayment detected");
        }
    }

    private Account getOrCreateAccountsReceivable(Company company) {
        if (company.getAccountsReceivableAccount() != null) {
            return company.getAccountsReceivableAccount();
        }

        // Try to find an existing one
        Account existingAr = accountRepo.findByAccountNameIgnoreCaseAndAccountTypeAndCompany_CompanyId(
                "Accounts Receivable", AccountType.ASSET_ACCOUNT_RECEIVABLE, company.getCompanyId()
        ).orElse(null);

        if (existingAr != null) {
            company.setAccountsReceivableAccount(existingAr);
            companyRepo.save(company);
            return existingAr;
        }

        // Create a new one
        Account newAr = new Account();
        newAr.setAccountName("Accounts Receivable");
        newAr.setAccountType(AccountType.ASSET_ACCOUNT_RECEIVABLE);
        newAr.setCompany(company);
        newAr.setNormalizedName("ACCOUNTS RECEIVABLE");
        newAr.setNormalizedSubAccount("");

        // Find next valid asset code (e.g., 1200)
        String code = "1200";
        while(accountRepo.findByAccountCodeAndCompany_CompanyId(code, company.getCompanyId()).isPresent()) {
            code = String.valueOf(Integer.parseInt(code) + 1);
        }
        newAr.setAccountCode(code);
        newAr.setActive(true);
        newAr.setCurrentBalance(BigDecimal.ZERO);

        Account savedAr = accountRepo.save(newAr);
        company.setAccountsReceivableAccount(savedAr);
        companyRepo.save(company);

        return savedAr;
    }

    private void createJournalEntries(SalesOrder order) {
        Company company = order.getCompany();
        Account arAccount = getOrCreateAccountsReceivable(company);

        JournalEntryDto journal = new JournalEntryDto();
        journal.setEntryType(JournalEntryType.SALE);
        journal.setEntryDate(order.getIssueDate());
        journal.setJournalTitle("Sales Journal");
        journal.setReferenceNo(order.getSoNumber());
        journal.setCompanyId(order.getCompany().getCompanyId());
        journal.setDescription("Sales Order #" + order.getId());

        List<JournalEntryLineDto> lines = new ArrayList<>();

        for (SalesOrderLineItem item : order.getItems()) {
            BigDecimal lineTotal = item.getAmount() != null
                    ? item.getAmount()
                    : BigDecimal.ZERO;

            lines.add(new JournalEntryLineDto(
                    item.getAccount().getAccountCode(),
                    lineTotal,
                    false,
                    item.getDescription()
            ));
        }

        if (order.getAmountPaid().compareTo(BigDecimal.ZERO) > 0) {
            if (order.getPaymentAccount() == null) {
                throw new IllegalStateException("Payment account not found. Please select a payment account.");
            }
            lines.add(new JournalEntryLineDto(
                    order.getPaymentAccount().getAccountCode(),
                    order.getAmountPaid(),
                    true,
                    "Received Payment"
            ));
        }

        if (order.getBalanceDue().compareTo(BigDecimal.ZERO) > 0) {
            lines.add(new JournalEntryLineDto(
                    arAccount.getAccountCode(),
                    order.getBalanceDue(),
                    true,
                    "Receivable from " + order.getCustomer().getName()
            ));
        }

        journal.setLines(lines);
        journalService.createJournalEntry(journal);
    }

    private void createAgingReceivableSnapshot(SalesOrder order) {
        AgingReceivableSnapshot snapshot = new AgingReceivableSnapshot();
        snapshot.setCompany(order.getCompany());
        snapshot.setCustomer(order.getCustomer());
        snapshot.setSoNumber(order.getSoNumber());
        snapshot.setDueDate(order.getDueDate());
        snapshot.setBalanceDue(order.getBalanceDue());
        snapshot.setSnapshotDate(LocalDate.now());

        snapshot.computeBuckets(LocalDate.now());

        agingReceivableSnapshotRepo.save(snapshot);
    }

    @Transactional
    public void paySalesOrder(Long soId, SalesPaymentRequestDto request) {
        SalesOrder order = salesOrderRepo.findById(soId)
                .orElseThrow(() -> new ResourceNotFoundException("Sales Order not found"));

        if (!order.getCompany().getCompanyId().equals(request.getCompanyId())) {
            throw new AccessDeniedException("Sales Order does not belong to your company");
        }

        if (order.getBalanceDue().compareTo(BigDecimal.ZERO) == 0) {
            throw new IllegalStateException("Sales Order is already fully paid");
        }

        if (request.getAmount().compareTo(order.getBalanceDue()) > 0) {
            throw new IllegalArgumentException("Payment exceeds remaining balance");
        }

        Account paymentAccount = accountRepo.findByAccountCodeAndCompany_CompanyId(
                request.getPaymentAccountCode(),
                request.getCompanyId()
        ).orElseThrow(() -> new ResourceNotFoundException("Payment account not found"));

        order.setAmountPaid(order.getAmountPaid().add(request.getAmount()));
        order.setBalanceDue(order.getBalanceDue().subtract(request.getAmount()));
        salesOrderRepo.save(order);

        Transaction transaction = new Transaction();
        transaction.setReferenceNumber(order.getSoNumber());
        transaction.setDate(LocalDate.now().toString());
        transaction.setDescription("Receive Money - " + order.getCustomer().getName() + " (SO: " + order.getSoNumber() + ")");
        transaction.setTotalDebit(request.getAmount().doubleValue());
        transaction.setTotalCredit(0.0);
        transaction.setCompany(order.getCompany());
        transactionRepo.save(transaction);

        Account arAccount = getOrCreateAccountsReceivable(order.getCompany());

        JournalEntryDto journal = new JournalEntryDto();
        journal.setEntryType(JournalEntryType.RECEIPT);
        journal.setEntryDate(LocalDate.now());
        journal.setJournalTitle("Sales Payment");
        journal.setReferenceNo(order.getSoNumber());
        journal.setCompanyId(request.getCompanyId());
        journal.setDescription("Payment received for SO #" + order.getId());

        List<JournalEntryLineDto> lines = new ArrayList<>();

        lines.add(new JournalEntryLineDto(
                paymentAccount.getAccountCode(),
                request.getAmount(),
                true,
                "Customer payment received"
        ));

        lines.add(new JournalEntryLineDto(
                arAccount.getAccountCode(),
                request.getAmount(),
                false,
                "Reduce receivable from customer"
        ));

        journal.setLines(lines);
        journalService.createJournalEntry(journal);
    }

    private SalesOrderResponseDto convertToDto(SalesOrder order) {
        SalesOrderResponseDto dto = new SalesOrderResponseDto();
        dto.setId(order.getId());
        dto.setCustomerId(order.getCustomer().getId());
        dto.setCustomerName(order.getCustomer().getName());
        dto.setSoNumber(order.getSoNumber());
        dto.setIssueDate(order.getIssueDate());
        dto.setDueDate(order.getDueDate());
        dto.setNotes(order.getNotes());
        dto.setSubtotal(order.getSubtotal());
        dto.setTotal(order.getTotal());
        dto.setAmountPaid(order.getAmountPaid());
        dto.setBalanceDue(order.getBalanceDue());
        dto.setSalesType(order.getSalesType());
        dto.setItems(
                order.getItems()
                        .stream()
                        .map(this::convertLineToDto)
                        .collect(Collectors.toList())
        );
        return dto;
    }

    private SalesOrderItemResponseDto convertLineToDto(SalesOrderLineItem item) {
        SalesOrderItemResponseDto dto = new SalesOrderItemResponseDto();

        if (item.getItem() != null) {
            dto.setItemId(item.getItem().getItemId());
            dto.setItemName(item.getItem().getName());
        }

        dto.setDescription(item.getDescription());
        dto.setQuantity(item.getQuantity());
        dto.setUnitPrice(item.getUnitPrice());
        dto.setDiscountPercent(item.getDiscountPercent());
        dto.setAmount(item.getAmount());
        dto.setAccountCode(item.getAccount() != null ? item.getAccount().getAccountCode() : null);
        dto.setProjectId(item.getProject() != null ? item.getProject().getId() : null);
        dto.setItemType(item.getItemType());

        return dto;
    }

    private BigDecimal valueOrZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    public List<SalesOrderResponseDto> getSalesOrdersByCompany(Integer companyId) {
        return salesOrderRepo.findByCompany_CompanyId(companyId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
}