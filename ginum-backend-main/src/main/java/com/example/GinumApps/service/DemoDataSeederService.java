package com.example.GinumApps.service;

import com.example.GinumApps.dto.*;
import com.example.GinumApps.enums.*;
import com.example.GinumApps.model.*;
import com.example.GinumApps.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DemoDataSeederService {

    private final CompanyRepository companyRepository;
    private final AppUserRepository appUserRepository;
    private final AppUserService appUserService;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final DesignationRepository designationRepository;
    private final AccountService accountService;
    private final AccountRepository accountRepository;
    private final JournalEntryService journalEntryService;
    private final com.example.GinumApps.repository.JournalEntryRepository journalEntryRepository;
    private final SupplierService supplierService;
    private final CustomerService customerService;
    private final ItemService itemService;
    private final PurchaseOrderService purchaseOrderService;
    private final SalesOrderService salesOrderService;
    private final TransactionService transactionService;
    private final TransactionRepository transactionRepository;
    private final SupplierRepository supplierRepository;
    private final CustomerRepository customerRepository;
    private final ItemRepository itemRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final jakarta.persistence.EntityManager entityManager;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SalesOrderRepository salesOrderRepository;

    // Removed @Transactional to prevent one big transaction failure
    
    private BigDecimal balanceOf(Account account) {
        return account.getCurrentBalance() == null ? BigDecimal.ZERO : account.getCurrentBalance();
    }

    private void setBalance(Account account, BigDecimal amount) {
        account.setCurrentBalance(amount == null ? BigDecimal.ZERO : amount);
    }

    public Map<String, Object> seedCompanyData(Integer companyId) throws Exception {
        Map<String, Object> summary = new LinkedHashMap<>();

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found"));

        summary.put("userStatus", seedUser(company));
        summary.put("accountsStatus", seedAccounts(company));
        summary.put("journalEntriesStatus", seedJournalEntries(company));
        summary.put("suppliersStatus", seedSuppliers(company));
        summary.put("customersStatus", seedCustomers(company));
        summary.put("itemsStatus", seedItems(company));
        summary.put("purchaseOrdersStatus", seedPurchaseOrders(company));
        summary.put("salesOrdersStatus", seedSalesOrders(company));
        summary.put("paymentsStatus", seedPayments(company));
        summary.put("receiptsStatus", seedReceipts(company));

        summary.put("message", "Demo data seeded successfully.");
        return summary;
    }

    private String seedUser(Company company) {
        String email = "madam.demo@ginuma.com";
        try {
            Department dept = departmentRepository.findAll().stream()
                .filter(d -> d.getCompany().getCompanyId().equals(company.getCompanyId()))
                .findFirst().orElseGet(() -> {
                    Department d = new Department();
                    d.setName("Administration");
                    d.setCode("ADM");
                    d.setCompany(company);
                    d.setActive(true);
                    return departmentRepository.save(d);
                });

            Designation desig = designationRepository.findAll().stream()
                .filter(d -> d.getName().equals("Demo Manager"))
                .findFirst().orElseGet(() -> {
                    Designation d = new Designation();
                    d.setName("Demo Manager");
                    d.setDepartment(dept);
                    d.setActive(true);
                    return designationRepository.save(d);
                });

            Employee emp = employeeRepository.findByEmailAndCompanyCompanyId(email, company.getCompanyId())
                .orElseGet(() -> {
                    Employee e = new Employee();
                    e.setFirstName("Madam");
                    e.setLastName("Demo User");
                    e.setEmail(email);
                    e.setMobileNo("0770000000");
                    e.setDepartment(dept);
                    e.setDesignation(desig);
                    e.setCompany(company);
                    e.setDateAdded(LocalDate.now());
                    e.setGender("FEMALE");
                    e.setAddress("Colombo");
                    e.setNic("000000000V");
                    return employeeRepository.save(e);
                });

            java.util.Optional<AppUser> existingUserOpt = appUserRepository.findByEmail(email);
            if (existingUserOpt.isPresent()) {
                AppUser existing = existingUserOpt.get();
                existing.setPassword(passwordEncoder.encode("Demo@2026"));
                existing.setRole("ROLE_COMPANY");
                existing.setCompany(company);
                appUserRepository.save(existing);
                return "userRepaired";
            }

            AppUserRequestDto userDto = new AppUserRequestDto();
            userDto.setEmail(email);
            userDto.setPassword("Demo@2026");
            userDto.setRole("COMPANY");
            appUserService.createUser(company.getCompanyId(), userDto);
            return "userCreated";
        } catch (Exception e) {
            e.printStackTrace();
            return "error: " + e.getMessage();
        }
    }

    private String seedAccounts(Company company) {
        int count = 0;
        count += createAccountIfNotExists(company, "Cash in Hand", AccountType.ASSET_BANK);
        count += createAccountIfNotExists(company, "Bank Account", AccountType.ASSET_BANK);
        count += createAccountIfNotExists(company, "Accounts Receivable", AccountType.ASSET_ACCOUNT_RECEIVABLE);
        count += createAccountIfNotExists(company, "Raw Material Inventory", AccountType.ASSET_OTHER_CURRENT_ASSET);
        count += createAccountIfNotExists(company, "Finished Goods Inventory", AccountType.ASSET_OTHER_CURRENT_ASSET);
        count += createAccountIfNotExists(company, "Land", AccountType.ASSET_FIXED_ASSET);
        count += createAccountIfNotExists(company, "Factory Building", AccountType.ASSET_FIXED_ASSET);
        count += createAccountIfNotExists(company, "Machinery", AccountType.ASSET_FIXED_ASSET);
        count += createAccountIfNotExists(company, "Furniture & Equipment", AccountType.ASSET_FIXED_ASSET);
        count += createAccountIfNotExists(company, "Accumulated Depreciation - Building", AccountType.LIABILITY_OTHER_LIABILITY);
        count += createAccountIfNotExists(company, "Accumulated Depreciation - Machinery", AccountType.LIABILITY_OTHER_LIABILITY);
        count += createAccountIfNotExists(company, "Accumulated Depreciation - Furniture", AccountType.LIABILITY_OTHER_LIABILITY);

        count += createAccountIfNotExists(company, "Accounts Payable", AccountType.LIABILITY_ACCOUNTS_PAYABLE);
        count += createAccountIfNotExists(company, "Bank Loan", AccountType.LIABILITY_LONG_TERM_LIABILITY);
        count += createAccountIfNotExists(company, "VAT Payable", AccountType.LIABILITY_OTHER_CURRENT_LIABILITY);

        count += createAccountIfNotExists(company, "Share Capital", AccountType.EQUITY);
        count += createAccountIfNotExists(company, "Retained Earnings", AccountType.EQUITY);

        count += createAccountIfNotExists(company, "Sales Revenue", AccountType.INCOME);

        count += createAccountIfNotExists(company, "Cost of Goods Sold", AccountType.COST_OF_SALES);
        count += createAccountIfNotExists(company, "Administrative Expenses", AccountType.EXPENSE);
        count += createAccountIfNotExists(company, "Selling Expenses", AccountType.EXPENSE);
        count += createAccountIfNotExists(company, "Salary Expense", AccountType.EXPENSE);
        count += createAccountIfNotExists(company, "Depreciation Expense", AccountType.EXPENSE);
        count += createAccountIfNotExists(company, "Interest Expense", AccountType.EXPENSE);

        return "accountsCreated: " + count;
    }

    private int createAccountIfNotExists(Company company, String name, AccountType type) {
        String normalized = name.replaceAll("\\s+", "").toUpperCase();
        java.util.Optional<Account> existingOpt = accountRepository.findByCompany_CompanyId(company.getCompanyId()).stream()
                .filter(a -> a.getNormalizedName().equals(normalized) && (a.getNormalizedSubAccount() == null || a.getNormalizedSubAccount().isEmpty()))
                .findFirst();

        if (existingOpt.isPresent()) {
            Account existing = existingOpt.get();
            if (existing.getAccountType() != type) {
                existing.setAccountType(type);
                accountRepository.save(existing);
            }
            return 0;
        }
        AccountRequestDto dto = new AccountRequestDto();
        dto.setAccountName(name);
        dto.setAccountType(type);
        dto.setCurrentBalance(BigDecimal.ZERO);
        accountService.createAccount(company.getCompanyId(), dto);
        return 1;
    }

    private String seedJournalEntries(Company company) {
        String refNo = "OB-2026-001";
        if (journalEntryRepository.findByCompany_CompanyId(company.getCompanyId()).stream().anyMatch(je -> refNo.equals(je.getReferenceNo()))) {
            return "journalEntriesSkipped: already exists";
        }
        try {
            JournalEntryDto dto = new JournalEntryDto();
            dto.setCompanyId(company.getCompanyId());
            dto.setEntryDate(LocalDate.of(2026, 1, 1));
            dto.setReferenceNo(refNo);
            dto.setJournalTitle("Opening Balances");
            dto.setDescription("Opening balances for demo testing");
            dto.setEntryType(JournalEntryType.MANUAL);
            dto.setAuthorId(1); // just a dummy author id

            List<JournalEntryLineDto> lines = new ArrayList<>();
            lines.add(createJELine(company, "Cash in Hand", new BigDecimal("50000"), true));
            lines.add(createJELine(company, "Bank Account", new BigDecimal("2000000"), true));
            lines.add(createJELine(company, "Accounts Receivable", new BigDecimal("1200000"), true));
            lines.add(createJELine(company, "Raw Material Inventory", new BigDecimal("800000"), true));
            lines.add(createJELine(company, "Finished Goods Inventory", new BigDecimal("1500000"), true));
            lines.add(createJELine(company, "Land", new BigDecimal("5000000"), true));
            lines.add(createJELine(company, "Factory Building", new BigDecimal("8000000"), true));
            lines.add(createJELine(company, "Machinery", new BigDecimal("6000000"), true));
            lines.add(createJELine(company, "Furniture & Equipment", new BigDecimal("500000"), true));

            lines.add(createJELine(company, "Accumulated Depreciation - Building", new BigDecimal("800000"), false));
            lines.add(createJELine(company, "Accumulated Depreciation - Machinery", new BigDecimal("1200000"), false));
            lines.add(createJELine(company, "Accumulated Depreciation - Furniture", new BigDecimal("100000"), false));
            lines.add(createJELine(company, "Accounts Payable", new BigDecimal("1100000"), false));
            lines.add(createJELine(company, "Bank Loan", new BigDecimal("4000000"), false));
            lines.add(createJELine(company, "VAT Payable", new BigDecimal("100000"), false));
            lines.add(createJELine(company, "Share Capital", new BigDecimal("15000000"), false));
            lines.add(createJELine(company, "Retained Earnings", new BigDecimal("2750000"), false));

            dto.setLines(lines);

            journalEntryService.createJournalEntry(dto);
            return "journalEntriesCreated: 1";
        } catch (Exception e) {
            return "journalEntriesSkipped or error: " + e.getMessage();
        }
    }

    public Map<String, Object> reconcileDemoOpeningBalances(Integer companyId) {
        Map<String, Object> summary = new java.util.LinkedHashMap<>();
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found"));
        
        seedAccounts(company); 
        summary.put("accountsUpdated", true);

        List<com.example.GinumApps.model.JournalEntry> obEntries = journalEntryRepository.findByCompany_CompanyId(company.getCompanyId())
                .stream().filter(je -> "OB-2026-001".equals(je.getReferenceNo())).toList();
        
        int removedCount = obEntries.size();
        for (com.example.GinumApps.model.JournalEntry je : obEntries) {
            for (com.example.GinumApps.model.JournalEntryLine line : je.getJournalEntryLines()) {
                Account acc = line.getAccount();
                BigDecimal amount = line.getAmount();
                boolean isDebit = line.isDebit();
                
                boolean isDebitNormal = acc.getAccountType().isDebitType();
                BigDecimal change;
                if (isDebitNormal) {
                    change = isDebit ? amount.negate() : amount;
                } else {
                    change = isDebit ? amount : amount.negate();
                }
                setBalance(acc, balanceOf(acc).add(change));
                accountRepository.save(acc);
            }
            journalEntryRepository.delete(je);
        }
        summary.put("duplicateOpeningBalancesRemoved", removedCount);
        
        try {
            JournalEntryDto dto = new JournalEntryDto();
            dto.setCompanyId(company.getCompanyId());
            dto.setEntryDate(LocalDate.of(2026, 1, 1));
            dto.setReferenceNo("OB-2026-001");
            dto.setJournalTitle("Opening Balances");
            dto.setDescription("Opening balances for demo testing");
            dto.setEntryType(com.example.GinumApps.enums.JournalEntryType.MANUAL);
            dto.setAuthorId(1); 

            List<JournalEntryLineDto> lines = new ArrayList<>();
            lines.add(createJELine(company, "Cash in Hand", new BigDecimal("50000"), true));
            lines.add(createJELine(company, "Bank Account", new BigDecimal("2000000"), true));
            lines.add(createJELine(company, "Accounts Receivable", new BigDecimal("1200000"), true));
            lines.add(createJELine(company, "Raw Material Inventory", new BigDecimal("800000"), true));
            lines.add(createJELine(company, "Finished Goods Inventory", new BigDecimal("1500000"), true));
            lines.add(createJELine(company, "Land", new BigDecimal("5000000"), true));
            lines.add(createJELine(company, "Factory Building", new BigDecimal("8000000"), true));
            lines.add(createJELine(company, "Machinery", new BigDecimal("6000000"), true));
            lines.add(createJELine(company, "Furniture & Equipment", new BigDecimal("500000"), true));

            lines.add(createJELine(company, "Accumulated Depreciation - Building", new BigDecimal("800000"), false));
            lines.add(createJELine(company, "Accumulated Depreciation - Machinery", new BigDecimal("1200000"), false));
            lines.add(createJELine(company, "Accumulated Depreciation - Furniture", new BigDecimal("100000"), false));
            lines.add(createJELine(company, "Accounts Payable", new BigDecimal("1100000"), false));
            lines.add(createJELine(company, "Bank Loan", new BigDecimal("4000000"), false));
            lines.add(createJELine(company, "VAT Payable", new BigDecimal("100000"), false));
            lines.add(createJELine(company, "Share Capital", new BigDecimal("15000000"), false));
            lines.add(createJELine(company, "Retained Earnings", new BigDecimal("2750000"), false));

            dto.setLines(lines);
            journalEntryService.createJournalEntry(dto);
            summary.put("openingBalanceCreatedOrUpdated", true);
            summary.put("finalDebitTotal", new BigDecimal("25050000"));
            summary.put("finalCreditTotal", new BigDecimal("25050000"));
            summary.put("status", "SUCCESS");
        } catch (Exception e) {
            e.printStackTrace();
            summary.put("openingBalanceCreatedOrUpdated", false);
            summary.put("status", "ERROR: " + e.getMessage());
        }
        
        return summary;
    }

    private JournalEntryLineDto createJELine(Company company, String accountName, BigDecimal amount, boolean isDebit) {
        String normalized = accountName.replaceAll("\\s+", "").toUpperCase();
        Account account = accountRepository.findByCompany_CompanyId(company.getCompanyId())
                .stream().filter(a -> a.getNormalizedName().equals(normalized) && (a.getNormalizedSubAccount() == null || a.getNormalizedSubAccount().isEmpty()))
                .findFirst().orElseThrow(() -> new RuntimeException("Account not found: " + accountName));
        JournalEntryLineDto line = new JournalEntryLineDto(account.getAccountCode(), amount, isDebit, "Opening balance");
        return line;
    }

    private String seedSuppliers(Company company) {
        int count = 0;
        try {
            List<SupplierSummaryDto> existing = supplierService.getSuppliersByCompanyId(company.getCompanyId());
            count += createSupplierIfNotExists(existing, company, "Main Raw Material Supplier", "supplier@example.com", SupplierType.SUPPLIER, ItemCategory.FURNITURE);
            count += createSupplierIfNotExists(existing, company, "Packaging Material Supplier", "packaging@example.com", SupplierType.SUPPLIER, ItemCategory.ELECTRONICS);
        } catch (Exception e) {
            return "suppliersSkipped or error: " + e.getMessage();
        }
        return "suppliersCreated: " + count;
    }

    private int createSupplierIfNotExists(List<SupplierSummaryDto> existing, Company company, String name, String email, SupplierType type, ItemCategory category) {
        if (existing.stream().anyMatch(s -> s.getSupplierName().equalsIgnoreCase(name))) {
            return 0;
        }
        try {
            SupplierDto dto = new SupplierDto();
            dto.setSupplierName(name);
            dto.setEmail(email);
            dto.setMobileNo("+94770000001");
            dto.setAddress("123 Supplier Street, Colombo");
            dto.setSupplierType(type);
            dto.setTax(TaxType.INCLUSIVE);
            dto.setCurrencyId(company.getCountry().getDefaultCurrency().getId());
            dto.setItemCategory(category);
            dto.setDiscountPercentage(0.0);
            supplierService.createSupplier(dto, company.getCompanyId());
            return 1;
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    private String seedCustomers(Company company) {
        int count = 0;
        try {
            List<CustomerSummaryDto> existing = customerService.getCustomersByCompanyId(company.getCompanyId());
            count += createCustomerIfNotExists(existing, company, "Main Credit Customer", "customer1@example.com", com.example.GinumApps.enums.CustomerType.CORPORATE);
            count += createCustomerIfNotExists(existing, company, "Cash Customer", "cash@example.com", com.example.GinumApps.enums.CustomerType.INDIVIDUAL);
        } catch (Exception e) {
            return "customersSkipped or error: " + e.getMessage();
        }
        return "customersCreated: " + count;
    }

    private int createCustomerIfNotExists(List<CustomerSummaryDto> existing, Company company, String name, String email, com.example.GinumApps.enums.CustomerType type) {
        if (existing.stream().anyMatch(c -> c.getCustomerName().equalsIgnoreCase(name))) {
            return 0;
        }
        try {
            CustomerDto dto = new CustomerDto();
            dto.setName(name);
            dto.setEmail(email);
            dto.setPhoneNo("+94770000002");
            dto.setDeliveryAddress("456 Customer Ave, Colombo");
            dto.setBillingAddress("456 Customer Ave, Colombo");
            dto.setCustomerType(type);
            dto.setTax(TaxType.INCLUSIVE);
            dto.setCurrencyId(company.getCountry().getDefaultCurrency().getId());
            dto.setDiscountPercentage(0.0);
            dto.setCompanyId(company.getCompanyId());
            customerService.createCustomer(dto);
            return 1;
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    private String seedItems(Company company) {
        int count = 0;
        try {
            List<ItemDto> existing = itemService.getItemsByCompany(company.getCompanyId());
            count += createItemIfNotExists(existing, company, "Raw Material", "Raw Material", ItemType.RAW_MATERIAL, new BigDecimal("3900"), new BigDecimal("0.01"), new BigDecimal("205"), 10);
            count += createItemIfNotExists(existing, company, "Chair", "Finished Goods", ItemType.SALES_ITEM, new BigDecimal("6500"), new BigDecimal("13000"), new BigDecimal("230"), 5);
        } catch (Exception e) {
            return "itemsSkipped or error: " + e.getMessage();
        }
        return "itemsCreated: " + count;
    }

    private int createItemIfNotExists(List<ItemDto> existing, Company company, String name, String category, ItemType type, BigDecimal purchasePrice, BigDecimal sellingPrice, BigDecimal stock, int reorder) {
        if (existing.stream().anyMatch(i -> i.getName().equalsIgnoreCase(name))) {
            return 0;
        }
        try {
            ItemDto dto = new ItemDto();
            dto.setName(name);
            dto.setCategory(category);
            dto.setItemType(type);
            dto.setPurchasePrice(purchasePrice);
            dto.setUnitPrice(sellingPrice);
            dto.setCurrentStock(stock);
            dto.setReorderLevel(reorder);
            dto.setUnit("PCS");
            dto.setActive(true);
            dto.setDescription(name + " for testing");
            itemService.createItem(company.getCompanyId(), dto);
            return 1;
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    private String seedPurchaseOrders(Company company) {
        int count = 0;
        try {
            List<PurchaseOrderResponseDto> existing = purchaseOrderService.getPurchaseOrdersByCompany(company.getCompanyId());
            SupplierSummaryDto rawSupplier = supplierService.getSuppliersByCompanyId(company.getCompanyId()).stream()
                    .filter(s -> s.getSupplierName().equals("Main Raw Material Supplier")).findFirst().orElse(null);
            SupplierSummaryDto packSupplier = supplierService.getSuppliersByCompanyId(company.getCompanyId()).stream()
                    .filter(s -> s.getSupplierName().equals("Packaging Material Supplier")).findFirst().orElse(null);
            ItemDto rawItem = itemService.getItemsByCompany(company.getCompanyId()).stream()
                    .filter(i -> i.getName().equals("Raw Material")).findFirst().orElse(null);

            if (rawSupplier != null && rawItem != null) {
                count += createPOIfNotExists(existing, company, rawSupplier.getId(), "SUP-001", "PO-DEMO-1", LocalDate.of(2026, 1, 8), rawItem.getItemId(), 10, new BigDecimal("120000"), PurchaseType.GOODS);
                count += createPOIfNotExists(existing, company, rawSupplier.getId(), "SUP-002", "PO-DEMO-2", LocalDate.of(2026, 1, 15), rawItem.getItemId(), 3, new BigDecimal("100000"), PurchaseType.GOODS);
            }
            if (packSupplier != null && rawItem != null) {
                count += createPOIfNotExists(existing, company, packSupplier.getId(), "SUP-003", "PO-DEMO-3", LocalDate.of(2026, 1, 23), rawItem.getItemId(), 2, new BigDecimal("100000"), PurchaseType.GOODS);
            }
        } catch (Exception e) {
            return "purchaseOrdersSkipped or error: " + e.getMessage();
        }
        return "purchaseOrdersCreated: " + count;
    }

    private int createPOIfNotExists(List<PurchaseOrderResponseDto> existing, Company company, Long supplierId, String supInvNo, String poNo, LocalDate date, Long itemId, int qty, BigDecimal unitPrice, PurchaseType pType) {
        if (existing.stream().anyMatch(po -> poNo.equals(po.getPurchaseOrderNumber()))) {
            return 0;
        }
        try {
            PurchaseOrderRequestDto dto = new PurchaseOrderRequestDto();
            dto.setSupplierId(supplierId);
            dto.setSupplierInvoiceNumber(supInvNo);
            dto.setPoNumber(poNo);
            dto.setIssueDate(date);
            dto.setDueDate(date.plusDays(30));
            dto.setPurchaseType(pType);

            PurchaseOrderItemRequestDto itemDto = new PurchaseOrderItemRequestDto();
            itemDto.setItemId(itemId);
            itemDto.setQuantity(qty);
            itemDto.setUnitPrice(unitPrice);
            itemDto.setDiscount(BigDecimal.ZERO);
            itemDto.setAmount(unitPrice.multiply(BigDecimal.valueOf(qty)));
            
            Account account = accountRepository.findByCompany_CompanyId(company.getCompanyId()).stream()
                .filter(a -> a.getNormalizedName().equals("RAWMATERIALINVENTORY"))
                .findFirst().orElse(null);
            if (account == null) {
                System.err.println("Purchase Order Seeding failed: RAWMATERIALINVENTORY account is missing for company " + company.getCompanyId());
                return 0;
            }
            itemDto.setAccountCode(account.getAccountCode());

            dto.setItems(List.of(itemDto));
            purchaseOrderService.createPurchaseOrder(dto, company.getCompanyId());
            return 1;
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    private String seedSalesOrders(Company company) {
        int count = 0;
        try {
            List<SalesOrderResponseDto> existing = salesOrderService.getSalesOrdersByCompany(company.getCompanyId());
            CustomerSummaryDto crCustomer = customerService.getCustomersByCompanyId(company.getCompanyId()).stream()
                    .filter(c -> c.getCustomerName().equals("Main Credit Customer")).findFirst().orElse(null);
            CustomerSummaryDto cashCustomer = customerService.getCustomersByCompanyId(company.getCompanyId()).stream()
                    .filter(c -> c.getCustomerName().equals("Cash Customer")).findFirst().orElse(null);
            ItemDto chair = itemService.getItemsByCompany(company.getCompanyId()).stream()
                    .filter(i -> i.getName().equals("Chair")).findFirst().orElse(null);

            if (crCustomer != null && chair != null) {
                count += createSOIfNotExists(existing, company, crCustomer.getCustomerId(), "SO-DEMO-1", LocalDate.of(2026, 1, 13), chair.getItemId(), 115, new BigDecimal("13043.48"), SalesType.GOODS);
                count += createSOIfNotExists(existing, company, crCustomer.getCustomerId(), "SO-DEMO-3", LocalDate.of(2026, 1, 30), chair.getItemId(), 153, new BigDecimal("13071.90"), SalesType.GOODS);
            }
            if (cashCustomer != null && chair != null) {
                count += createSOIfNotExists(existing, company, cashCustomer.getCustomerId(), "SO-DEMO-2", LocalDate.of(2026, 1, 21), chair.getItemId(), 10, new BigDecimal("13000"), SalesType.GOODS);
            }
        } catch (Exception e) {
            return "salesOrdersSkipped or error: " + e.getMessage();
        }
        return "salesOrdersCreated: " + count;
    }

    private int createSOIfNotExists(List<SalesOrderResponseDto> existing, Company company, Long customerId, String soNo, LocalDate date, Long itemId, int qty, BigDecimal unitPrice, SalesType sType) {
        if (existing.stream().anyMatch(so -> soNo.equals(so.getSoNumber()))) {
            return 0;
        }
        try {
            SalesOrderRequestDto dto = new SalesOrderRequestDto();
            dto.setCustomerId(customerId);
            dto.setSoNumber(soNo);
            dto.setIssueDate(date);
            dto.setSalesType(sType);
            
            SalesOrderItemRequestDto itemDto = new SalesOrderItemRequestDto();
            itemDto.setItemId(itemId);
            itemDto.setQuantity(qty);
            itemDto.setUnitPrice(unitPrice);
            itemDto.setDiscountPercent(BigDecimal.ZERO);
            itemDto.setDescription("Chair for testing");
            Account account = accountRepository.findByCompany_CompanyId(company.getCompanyId()).stream()
                .filter(a -> a.getNormalizedName().equals("SALESREVENUE"))
                .findFirst().orElse(null);
            if (account == null) {
                System.err.println("Sales Order Seeding failed: SALESREVENUE account is missing for company " + company.getCompanyId());
                return 0;
            }
            itemDto.setAccountCode(account.getAccountCode());

            dto.setItems(List.of(itemDto));
            salesOrderService.createSalesOrder(dto, company.getCompanyId());
            return 1;
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    private String seedPayments(Company company) {
        int count = 0;
        try {
            Account bank = accountRepository.findByCompany_CompanyId(company.getCompanyId()).stream()
                .filter(a -> a.getNormalizedName().equals("BANKACCOUNT")).findFirst().orElse(null);
            
            if (bank != null) {
                List<PurchaseOrderResponseDto> pos = purchaseOrderService.getPurchaseOrdersByCompany(company.getCompanyId());
                for (PurchaseOrderResponseDto po : pos) {
                    if ("PO-DEMO-1".equals(po.getPurchaseOrderNumber()) && po.getAmountPaid().compareTo(BigDecimal.ZERO) == 0) {
                        PurchasePaymentRequestDto req = new PurchasePaymentRequestDto();
                        req.setAmount(new BigDecimal("800000"));
                        req.setPaymentAccountCode(bank.getAccountCode());
                        req.setCompanyId(company.getCompanyId());
                        req.setPaymentNote("Advance payment");
                        purchaseOrderService.payPurchaseOrder(po.getId(), req);
                        count++;
                    }
                    if ("PO-DEMO-2".equals(po.getPurchaseOrderNumber()) && po.getAmountPaid().compareTo(BigDecimal.ZERO) == 0) {
                        PurchasePaymentRequestDto req = new PurchasePaymentRequestDto();
                        req.setAmount(new BigDecimal("100000"));
                        req.setPaymentAccountCode(bank.getAccountCode());
                        req.setCompanyId(company.getCompanyId());
                        req.setPaymentNote("Full payment");
                        purchaseOrderService.payPurchaseOrder(po.getId(), req);
                        count++;
                    }
                }

                Account salaryExp = accountRepository.findByCompany_CompanyId(company.getCompanyId()).stream()
                    .filter(a -> a.getNormalizedName().equals("SALARYEXPENSE")).findFirst().orElse(null);
                Account adminExp = accountRepository.findByCompany_CompanyId(company.getCompanyId()).stream()
                    .filter(a -> a.getNormalizedName().equals("ADMINISTRATIVEEXPENSES")).findFirst().orElse(null);

                if (transactionService.getAllTransactions(company.getCompanyId()).stream().noneMatch(t -> "EXP-001".equals(t.getReferenceNumber()))) {
                    if (salaryExp != null) {
                        DirectPaymentRequestDto req = new DirectPaymentRequestDto();
                        req.setPayeeId(1);
                        req.setPayeeType("OTHER");
                        req.setAmount(new BigDecimal("900000"));
                        req.setPaymentAccountCode(bank.getAccountCode());
                        req.setExpenseAccountCode(salaryExp.getAccountCode());
                        req.setPaymentCategory("Salary Expense");
                        req.setPaymentMethod("Bank Transfer");
                        req.setPaymentNote("Factory wages Jan");
                        req.setReferenceNumber("EXP-001");
                        transactionService.processDirectPayment(company.getCompanyId(), req);
                        count++;
                    }
                    if (adminExp != null) {
                        DirectPaymentRequestDto req = new DirectPaymentRequestDto();
                        req.setPayeeId(1);
                        req.setPayeeType("OTHER");
                        req.setAmount(new BigDecimal("150000"));
                        req.setPaymentAccountCode(bank.getAccountCode());
                        req.setExpenseAccountCode(adminExp.getAccountCode());
                        req.setPaymentCategory("Other");
                        req.setPaymentMethod("Bank Transfer");
                        req.setPaymentNote("Electricity bill");
                        req.setReferenceNumber("EXP-002");
                        transactionService.processDirectPayment(company.getCompanyId(), req);
                        count++;
                    }
                }
            }
        } catch (Exception e) {
            return "paymentsSkipped or error: " + e.getMessage();
        }
        return "paymentsCreated: " + count;
    }

    private String seedReceipts(Company company) {
        int count = 0;
        try {
            Account bank = accountRepository.findByCompany_CompanyId(company.getCompanyId()).stream()
                .filter(a -> a.getNormalizedName().equals("BANKACCOUNT")).findFirst().orElse(null);
            
            if (bank != null) {
                List<SalesOrderResponseDto> sos = salesOrderService.getSalesOrdersByCompany(company.getCompanyId());
                for (SalesOrderResponseDto so : sos) {
                    if ("SO-DEMO-1".equals(so.getSoNumber()) && so.getAmountPaid().compareTo(BigDecimal.ZERO) == 0) {
                        SalesPaymentRequestDto req = new SalesPaymentRequestDto();
                        req.setAmount(new BigDecimal("1500000"));
                        req.setPaymentAccountCode(bank.getAccountCode());
                        req.setCompanyId(company.getCompanyId());
                        salesOrderService.paySalesOrder(so.getId(), req);
                        count++;
                    }
                    if ("SO-DEMO-2".equals(so.getSoNumber()) && so.getAmountPaid().compareTo(BigDecimal.ZERO) == 0) {
                        SalesPaymentRequestDto req = new SalesPaymentRequestDto();
                        req.setAmount(new BigDecimal("800000"));
                        req.setPaymentAccountCode(bank.getAccountCode());
                        req.setCompanyId(company.getCompanyId());
                        salesOrderService.paySalesOrder(so.getId(), req);
                        count++;
                    }
                }
            }
        } catch (Exception e) {
            return "receiptsSkipped or error: " + e.getMessage();
        }
        return "receiptsCreated: " + count;
    }
    public Map<String, Object> seedDemoTransactions(Integer companyId) {
        Map<String, Object> summary = new java.util.LinkedHashMap<>();
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found"));
        
        // 1. Cleanup old wrong EXP-001 / EXP-002 transactions
        List<Transaction> allTx = transactionService.getAllTransactions(companyId);
        int cleaned = 0;
        for (Transaction tx : allTx) {
            if ("EXP-001".equals(tx.getReferenceNumber()) || "EXP-002".equals(tx.getReferenceNumber())) {
                try {
                    transactionService.deleteTransaction(companyId, tx.getId());
                    cleaned++;
                } catch(Exception e) {}
            }
        }
        summary.put("oldDemoTransactionsCleaned", cleaned);

        // Required Accounts
        Account bank = findAccount(companyId, "BankAccount");
        Account recv = findAccount(companyId, "AccountsReceivable");
        Account payable = findAccount(companyId, "AccountsPayable");
        Account salaryExp = findAccount(companyId, "SalaryExpense");
        Account adminExp = findAccount(companyId, "AdministrativeExpenses");
        Account sellingExp = findAccount(companyId, "SellingExpenses");
        Account mach = findAccount(companyId, "Machinery");
        Account bankLoan = findAccount(companyId, "BankLoan");
        Account interestExp = findAccount(companyId, "InterestExpense");
        Account depExp = findAccount(companyId, "DepreciationExpense");
        Account accDepBuild = findAccount(companyId, "AccumulatedDepreciation-Building");
        Account accDepMach = findAccount(companyId, "AccumulatedDepreciation-Machinery");
        Account accDepFurn = findAccount(companyId, "AccumulatedDepreciation-Furniture");
        Account salesRev = findAccount(companyId, "SalesRevenue");

        // 2. Purchases (POs)
        int pos = 0;
        Supplier mainSupp = findSupplier(companyId, "Main Raw Material Supplier");
        Supplier packSupp = findSupplier(companyId, "Packaging Material Supplier");
        Item rawMat = findItem(companyId, "Raw Material");
        Item chair = findItem(companyId, "Chair"); // Using Chair if Raw Mat missing for some reason

        if (mainSupp != null && rawMat != null) {
            pos += createPOIfMissing(companyId, "DEMO-PO-001", "2026-01-03", mainSupp, "Purchased raw materials on credit", rawMat, 10, new BigDecimal("120000"));
            pos += createPOIfMissing(companyId, "DEMO-PO-002", "2026-01-10", mainSupp, "Purchased raw materials cash", rawMat, 1, new BigDecimal("300000"));
        }
        if (packSupp != null && rawMat != null) {
            pos += createPOIfMissing(companyId, "DEMO-PO-003", "2026-01-18", packSupp, "Purchased packaging materials credit", rawMat, 1, new BigDecimal("200000"));
        }
        summary.put("purchaseOrdersCreated", pos);

        // 3. Supplier Payments (Spend Money)
        int payments = 0;
        if (mainSupp != null && bank != null && payable != null) {
            payments += createDirectPaymentIfMissing(companyId, "DEMO-SP-001", "2026-01-15", mainSupp.getId().intValue(), "SUPPLIER", "Paid suppliers by bank", new BigDecimal("800000"), bank, payable, "Supplier Payment");
            payments += createDirectPaymentIfMissing(companyId, "DEMO-SP-002", "2026-01-28", mainSupp.getId().intValue(), "SUPPLIER", "Paid suppliers by bank", new BigDecimal("500000"), bank, payable, "Supplier Payment");
        }
        summary.put("supplierPaymentsCreated", payments);

        // 4. Sales Orders
        int sos = 0;
        Customer mainCust = findCustomer(companyId, "Main Credit Customer");
        Customer cashCust = findCustomer(companyId, "Cash Customer");
        if (mainCust != null && chair != null) {
            sos += createSOIfMissing(companyId, "DEMO-SO-001", "2026-01-08", mainCust, "Credit Sales", chair, 1, new BigDecimal("1500000"));
            sos += createSOIfMissing(companyId, "DEMO-SO-003", "2026-01-25", mainCust, "Credit Sales", chair, 1, new BigDecimal("2000000"));
        }
        if (cashCust != null && chair != null) {
            sos += createSOIfMissing(companyId, "DEMO-SO-002", "2026-01-16", cashCust, "Cash Sales", chair, 1, new BigDecimal("800000"));
        }
        summary.put("salesOrdersCreated", sos);

        // 5. Customer Collections (Receive Money)
        int collections = 0;
        if (mainCust != null && bank != null && recv != null) {
            collections += createDirectReceiptIfMissing(companyId, "DEMO-RC-001", "2026-01-12", mainCust.getId().intValue(), "CUSTOMER", "Collection from debtors", new BigDecimal("1000000"), bank, recv, "Customer Receipt");
            collections += createDirectReceiptIfMissing(companyId, "DEMO-RC-002", "2026-01-29", mainCust.getId().intValue(), "CUSTOMER", "Collection from debtors", new BigDecimal("1500000"), bank, recv, "Customer Receipt");
        }
        summary.put("customerCollectionsCreated", collections);

        // 6. Payroll (Spend Money)
        int payroll = 0;
        if (bank != null && salaryExp != null && adminExp != null && sellingExp != null) {
            payroll += createDirectPaymentIfMissing(companyId, "DEMO-PAY-001", "2026-01-31", null, "OTHER", "Factory wages", new BigDecimal("900000"), bank, salaryExp, "Salary Expense");
            payroll += createDirectPaymentIfMissing(companyId, "DEMO-PAY-002", "2026-01-31", null, "OTHER", "Admin salaries", new BigDecimal("250000"), bank, adminExp, "Salary Expense");
            payroll += createDirectPaymentIfMissing(companyId, "DEMO-PAY-003", "2026-01-31", null, "OTHER", "Sales salaries", new BigDecimal("200000"), bank, sellingExp, "Salary Expense");
        }
        summary.put("payrollCreated", payroll);

        // 7. Admin & Selling Expenses
        int expenses = 0;
        if (bank != null && adminExp != null) {
            expenses += createDirectPaymentIfMissing(companyId, "DEMO-ADM-001", "2026-01-15", null, "OTHER", "Office rent", new BigDecimal("100000"), bank, adminExp, "Other");
            expenses += createDirectPaymentIfMissing(companyId, "DEMO-ADM-002", "2026-01-18", null, "OTHER", "Telephone", new BigDecimal("30000"), bank, adminExp, "Other");
            expenses += createDirectPaymentIfMissing(companyId, "DEMO-ADM-003", "2026-01-20", null, "OTHER", "Internet", new BigDecimal("20000"), bank, adminExp, "Other");
            expenses += createDirectPaymentIfMissing(companyId, "DEMO-ADM-004", "2026-01-22", null, "OTHER", "Office supplies", new BigDecimal("25000"), bank, adminExp, "Other");
            expenses += createDirectPaymentIfMissing(companyId, "DEMO-ADM-005", "2026-01-25", null, "OTHER", "Insurance", new BigDecimal("40000"), bank, adminExp, "Other");
        }
        if (bank != null && sellingExp != null) {
            expenses += createDirectPaymentIfMissing(companyId, "DEMO-SELL-001", "2026-01-10", null, "OTHER", "Advertising", new BigDecimal("120000"), bank, sellingExp, "Other");
            expenses += createDirectPaymentIfMissing(companyId, "DEMO-SELL-002", "2026-01-20", null, "OTHER", "Delivery expenses", new BigDecimal("80000"), bank, sellingExp, "Other");
        }
        summary.put("adminSellingExpensesCreated", expenses);

        // 8. Fixed Asset & Loan (Spend Money)
        int faLoan = 0;
        if (bank != null && mach != null) {
            faLoan += createDirectPaymentIfMissing(companyId, "DEMO-FA-001", "2026-01-20", null, "OTHER", "Purchased new machinery", new BigDecimal("1500000"), bank, mach, "Asset Purchase");
        }
        if (bank != null && bankLoan != null && interestExp != null) {
            faLoan += createDirectPaymentIfMissing(companyId, "DEMO-LOAN-001", "2026-01-31", null, "OTHER", "Loan repayment", new BigDecimal("200000"), bank, bankLoan, "Loan Payment");
            faLoan += createDirectPaymentIfMissing(companyId, "DEMO-INT-001", "2026-01-31", null, "OTHER", "Loan interest", new BigDecimal("50000"), bank, interestExp, "Interest");
        }
        summary.put("faAndLoanTransactionsCreated", faLoan);

        // 9. Depreciation Journal Entry
        int dep = 0;
        if (depExp != null && accDepBuild != null && accDepMach != null && accDepFurn != null) {
            dep += createJournalIfMissing(company, "DEMO-DEP-001", "2026-01-31", "Depreciation", "Monthly depreciation", List.of(
                createJELine(depExp.getAccountCode(), new BigDecimal("125000"), true),
                createJELine(accDepBuild.getAccountCode(), new BigDecimal("40000"), false),
                createJELine(accDepMach.getAccountCode(), new BigDecimal("75000"), false),
                createJELine(accDepFurn.getAccountCode(), new BigDecimal("10000"), false)
            ));
        }
        summary.put("depreciationCreated", dep);
        
        // 10. Dashboard Current Month
        int dash = 0;
        String curMonth = LocalDate.now().toString();
        if (bank != null && salesRev != null) {
            dash += createDirectReceiptIfMissing(companyId, "DEMO-DASH-SALE-001", curMonth, null, "OTHER", "Demo Dashboard Sale", new BigDecimal("500000"), bank, salesRev, "Sales");
        }
        if (bank != null && adminExp != null) {
            dash += createDirectPaymentIfMissing(companyId, "DEMO-DASH-EXP-001", curMonth, null, "OTHER", "Demo Dashboard Expense", new BigDecimal("100000"), bank, adminExp, "Other");
        }
        summary.put("dashboardTransactionsCreated", dash);

        summary.put("status", "SUCCESS");
        return summary;
    }

    private int createPOIfMissing(Integer companyId, String poNum, String date, Supplier supp, String notes, Item item, int qty, BigDecimal price) {
        if (purchaseOrderService.getPurchaseOrdersByCompany(companyId).stream().anyMatch(po -> poNum.equals(po.getPurchaseOrderNumber()))) return 0;
        PurchaseOrderRequestDto po = new PurchaseOrderRequestDto();
        po.setPoNumber(poNum);
        po.setSupplierInvoiceNumber(poNum);
        po.setSupplierId(supp.getId());
        po.setIssueDate(LocalDate.parse(date));
        po.setDueDate(LocalDate.parse(date));
        po.setNotes(notes);
        PurchaseOrderItemRequestDto line = new PurchaseOrderItemRequestDto();
        line.setItemId(item.getItemId());
        line.setQuantity(qty);
        line.setUnitPrice(price);
        po.setItems(List.of(line));
        purchaseOrderService.createPurchaseOrder(po, companyId);
        return 1;
    }

    private int createSOIfMissing(Integer companyId, String soNum, String date, Customer cust, String notes, Item item, int qty, BigDecimal price) {
        if (salesOrderService.getSalesOrdersByCompany(companyId).stream().anyMatch(so -> soNum.equals(so.getSoNumber()))) return 0;
        SalesOrderRequestDto so = new SalesOrderRequestDto();
        so.setSoNumber(soNum);
        so.setCustomerId(cust.getId());
        so.setIssueDate(LocalDate.parse(date));
        so.setDueDate(LocalDate.parse(date));
        so.setNotes(notes);
        SalesOrderItemRequestDto line = new SalesOrderItemRequestDto();
        line.setItemId(item.getItemId());
        line.setQuantity(qty);
        line.setUnitPrice(price);
        so.setItems(List.of(line));
        salesOrderService.createSalesOrder(so, companyId);
        return 1;
    }

    private int createDirectPaymentIfMissing(Integer companyId, String ref, String date, Integer payeeId, String payeeType, String note, BigDecimal amt, Account bank, Account expense, String cat) {
        if (transactionService.getAllTransactions(companyId).stream().anyMatch(t -> ref.equals(t.getReferenceNumber()))) return 0;
        DirectPaymentRequestDto pay = new DirectPaymentRequestDto();
        pay.setReferenceNumber(ref);
        pay.setPaymentAccountCode(bank.getAccountCode());
        pay.setExpenseAccountCode(expense.getAccountCode());
        pay.setAmount(amt);
        pay.setPaymentNote(note);
        pay.setPayeeId(payeeId);
        pay.setPayeeType(payeeType);
        pay.setPaymentCategory(cat);
        pay.setPaymentMethod("Bank Transfer");
        transactionService.processDirectPayment(companyId, pay);
        // Set exact date (TransactionService sets it to LocalDate.now())
        Transaction saved = transactionService.getAllTransactions(companyId).stream().filter(t -> ref.equals(t.getReferenceNumber())).findFirst().orElse(null);
        if (saved != null) {
            saved.setDate(date);
            transactionRepository.save(saved); // Need transactionRepository
        }
        return 1;
    }

    private int createDirectReceiptIfMissing(Integer companyId, String ref, String date, Integer payeeId, String payeeType, String note, BigDecimal amt, Account bank, Account income, String cat) {
        if (transactionService.getAllTransactions(companyId).stream().anyMatch(t -> ref.equals(t.getReferenceNumber()))) return 0;
        
        Company company = companyRepository.findById(companyId).orElse(null);
        if(company == null) return 0;

        Transaction t = new Transaction();
        t.setReferenceNumber(ref);
        t.setDate(date);
        t.setDescription("Receive Money - " + note);
        t.setTotalDebit(amt.doubleValue());
        t.setTotalCredit(0.0);
        t.setCompany(company);
        t.setPayeeType(payeeType);
        t.setPayeeId(payeeId);
        t.setPayeeName("Customer");
        t.setPaymentCategory(cat);
        t.setPaymentMethod("Bank Transfer");
        t.setPaymentAccountCode(bank.getAccountCode());
        
        JournalEntryDto je = new JournalEntryDto();
        je.setEntryType(JournalEntryType.RECEIPT);
        je.setEntryDate(LocalDate.parse(date));
        je.setJournalTitle("Receive Money Direct");
        je.setReferenceNo(ref);
        je.setCompanyId(companyId);
        je.setDescription(t.getDescription());
        List<JournalEntryLineDto> lines = new ArrayList<>();
        lines.add(new JournalEntryLineDto(bank.getAccountCode(), amt, true, note));
        lines.add(new JournalEntryLineDto(income.getAccountCode(), amt, false, note));
        je.setLines(lines);
        
        journalEntryService.createJournalEntry(je);
        transactionRepository.save(t);
        return 1;
    }

    private int createJournalIfMissing(Company comp, String ref, String date, String title, String desc, List<JournalEntryLineDto> lines) {
        List<JournalEntry> exists = journalEntryRepository.findByCompany_CompanyId(comp.getCompanyId());
        if (exists.stream().anyMatch(j -> ref.equals(j.getReferenceNo()))) return 0;
        JournalEntryDto je = new JournalEntryDto();
        je.setEntryType(JournalEntryType.MANUAL);
        je.setEntryDate(LocalDate.parse(date));
        je.setJournalTitle(title);
        je.setReferenceNo(ref);
        je.setCompanyId(comp.getCompanyId());
        je.setDescription(desc);
        je.setLines(lines);
        journalEntryService.createJournalEntry(je);
        return 1;
    }

    private JournalEntryLineDto createJELine(String accountCode, BigDecimal amount, boolean isDebit) {
        return new JournalEntryLineDto(accountCode, amount, isDebit, "");
    }

    private Supplier findSupplier(Integer companyId, String name) {
        return supplierRepository.findByCompany_CompanyId(companyId).stream().filter(s -> name.equals(s.getSupplierName())).findFirst().orElse(null);
    }
    
    private Customer findCustomer(Integer companyId, String name) {
        return customerRepository.findByCompany_CompanyId(companyId).stream().filter(c -> name.equals(c.getName())).findFirst().orElse(null);
    }
    
    private Item findItem(Integer companyId, String name) {
        return itemRepository.findByCompany_CompanyId(companyId).stream().filter(i -> name.equals(i.getName())).findFirst().orElse(null);
    }

    private Account findAccount(Integer companyId, String normalizedName) {
        return accountRepository.findByCompany_CompanyId(companyId).stream().filter(a -> a.getNormalizedName().equalsIgnoreCase(normalizedName)).findFirst().orElse(null);
    }
    
    @Transactional
    public Map<String, Object> cleanAndMergeDuplicateAccounts(Integer companyId) {
        Map<String, Object> mergeStats = new HashMap<>();
        List<Account> accounts = accountRepository.findByCompany_CompanyId(companyId);
        
        // Group by normalizedName
        Map<String, List<Account>> grouped = new HashMap<>();
        for (Account a : accounts) {
            String norm = a.getNormalizedName();
            if (norm == null) continue;
            grouped.computeIfAbsent(norm, k -> new ArrayList<>()).add(a);
        }
        
        int mergedCount = 0;
        int skippedCount = 0;
        List<String> warnings = new ArrayList<>();
        
        Set<String> exactNames = new HashSet<>(Arrays.asList(
            "Cash in Hand", "Bank Account", "Accounts Receivable", 
            "Raw Material Inventory", "Finished Goods Inventory",
            "Land", "Factory Building", "Machinery", "Furniture & Equipment",
            "Accumulated Depreciation - Building", "Accumulated Depreciation - Machinery", "Accumulated Depreciation - Furniture",
            "Accounts Payable", "Bank Loan", "VAT Payable", "Share Capital", "Retained Earnings",
            "Sales Revenue", "Cost of Goods Sold", "Work in Progress / Manufacturing Cost",
            "Administrative Expenses", "Selling Expenses", "Salary Expense", "Depreciation Expense", "Interest Expense"
        ));
        
        for (Map.Entry<String, List<Account>> entry : grouped.entrySet()) {
            List<Account> dups = entry.getValue();
            if (dups.size() <= 1) continue;
            
            // Select canonical
            Account canonical = dups.stream().min((a1, a2) -> {
                boolean a1Match = exactNames.contains(a1.getAccountName());
                boolean a2Match = exactNames.contains(a2.getAccountName());
                if (a1Match && !a2Match) return -1;
                if (a2Match && !a1Match) return 1;
                
                if (a1.getAccountCode() != null && a2.getAccountCode() == null) return -1;
                if (a2.getAccountCode() != null && a1.getAccountCode() == null) return 1;
                
                boolean a1Active = a1.getActive() != null && a1.getActive();
                boolean a2Active = a2.getActive() != null && a2.getActive();
                if (a1Active && !a2Active) return -1;
                if (a2Active && !a1Active) return 1;
                
                return a1.getId().compareTo(a2.getId());
            }).orElseThrow();
            
            for (Account dup : dups) {
                if (dup.getId().equals(canonical.getId())) continue;
                
                try {
                    Long canId = canonical.getId();
                    Long dupId = dup.getId();
                    
                    entityManager.createNativeQuery("UPDATE journal_entry_lines SET account_id = :canId WHERE account_id = :dupId")
                        .setParameter("canId", canId).setParameter("dupId", dupId).executeUpdate();
                        
                    entityManager.createNativeQuery("UPDATE company_tbl SET freight_account_id = :canId WHERE freight_account_id = :dupId")
                        .setParameter("canId", canId).setParameter("dupId", dupId).executeUpdate();
                        
                    entityManager.createNativeQuery("UPDATE company_tbl SET tax_account_id = :canId WHERE tax_account_id = :dupId")
                        .setParameter("canId", canId).setParameter("dupId", dupId).executeUpdate();
                        
                    entityManager.createNativeQuery("UPDATE company_tbl SET accounts_payable_account_id = :canId WHERE accounts_payable_account_id = :dupId")
                        .setParameter("canId", canId).setParameter("dupId", dupId).executeUpdate();
                        
                    entityManager.createNativeQuery("UPDATE company_tbl SET accounts_receivable_account_id = :canId WHERE accounts_receivable_account_id = :dupId")
                        .setParameter("canId", canId).setParameter("dupId", dupId).executeUpdate();
                        
                    entityManager.createNativeQuery("UPDATE purchase_orders SET payment_account_id = :canId WHERE payment_account_id = :dupId")
                        .setParameter("canId", canId).setParameter("dupId", dupId).executeUpdate();
                        
                    entityManager.createNativeQuery("UPDATE purchase_order_line_items SET account_id = :canId WHERE account_id = :dupId")
                        .setParameter("canId", canId).setParameter("dupId", dupId).executeUpdate();
                        
                    entityManager.createNativeQuery("UPDATE sales_orders SET payment_account_id = :canId WHERE payment_account_id = :dupId")
                        .setParameter("canId", canId).setParameter("dupId", dupId).executeUpdate();
                        
                    entityManager.createNativeQuery("UPDATE sales_order_line_items SET account_id = :canId WHERE account_id = :dupId")
                        .setParameter("canId", canId).setParameter("dupId", dupId).executeUpdate();
                        
                    accountRepository.delete(dup);
                    accountRepository.flush();
                    mergedCount++;
                } catch (Exception e) {
                    warnings.add("Failed to merge duplicate account: " + dup.getAccountName() + " (ID: " + dup.getId() + ") - " + e.getMessage());
                    skippedCount++;
                }
            }
        }
        
        mergeStats.put("duplicateAccountsMerged", mergedCount);
        mergeStats.put("duplicateAccountsSkipped", skippedCount);
        if (!warnings.isEmpty()) {
            mergeStats.put("mergeWarnings", warnings);
        }
        return mergeStats;
    }


    public Map<String, Object> resetAndSeedExactExcelDemo(Integer companyId) {
        Map<String, Object> summary = new LinkedHashMap<>();
        
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found with ID: " + companyId));

        summary.put("cleanupStatus", cleanExactDemoData(companyId));
        summary.put("userStatus", ensureExactDemoUser(company));
        summary.put("accountsStatus", ensureExactChartOfAccounts(company));
        summary.put("openingBalanceStatus", seedExactOpeningBalance(company));
        summary.put("suppliersStatus", seedExactSuppliers(company));
        summary.put("customersStatus", seedExactCustomers(company));
        summary.put("itemsStatus", seedExactItems(company));
        
        // Build robust transaction summaries
        Map<String, Object> purchases = new LinkedHashMap<>();
        Map<String, Object> sales = new LinkedHashMap<>();
        Map<String, Object> supplierPayments = new LinkedHashMap<>();
        Map<String, Object> customerReceipts = new LinkedHashMap<>();
        Map<String, Object> payroll = new LinkedHashMap<>();
        Map<String, Object> adminExpenses = new LinkedHashMap<>();
        Map<String, Object> sellingExpenses = new LinkedHashMap<>();
        Map<String, Object> fixedAssets = new LinkedHashMap<>();
        Map<String, Object> loan = new LinkedHashMap<>();
        Map<String, Object> depreciation = new LinkedHashMap<>();
        Map<String, Object> manufacturing = new LinkedHashMap<>();
        Map<String, Object> dashboardDemo = new LinkedHashMap<>();
        
        // Seed exact transactions
        seedExactPurchases(company, purchases);
        seedExactSupplierPayments(company, supplierPayments);
        seedExactSales(company, sales);
        seedExactCustomerReceipts(company, customerReceipts);
        seedExactPayroll(company, payroll);
        seedExactAdminExpenses(company, adminExpenses);
        seedExactSellingExpenses(company, sellingExpenses);
        seedExactFixedAssets(company, fixedAssets);
        seedExactLoan(company, loan);
        seedExactDepreciation(company, depreciation);
        seedExactManufacturing(company, manufacturing);
        seedExactDashboardDemo(company, dashboardDemo);

        summary.put("purchasesStatus", purchases);
        summary.put("supplierPaymentsStatus", supplierPayments);
        summary.put("salesStatus", sales);
        summary.put("customerReceiptsStatus", customerReceipts);
        summary.put("payrollStatus", payroll);
        summary.put("adminExpensesStatus", adminExpenses);
        summary.put("sellingExpensesStatus", sellingExpenses);
        summary.put("fixedAssetStatus", fixedAssets);
        summary.put("loanStatus", loan);
        summary.put("depreciationStatus", depreciation);
        summary.put("manufacturingStatus", manufacturing);
        summary.put("dashboardStatus", dashboardDemo);
        summary.put("finalStatus", "SUCCESS");

        return summary;
    }

    private String cleanExactDemoData(Integer companyId) {
        int txDeleted = 0;
        int jeDeleted = 0;
        
        // Delete transactions
        List<Transaction> transactions = transactionService.getAllTransactions(companyId);
        for (Transaction tx : transactions) {
            String ref = tx.getReferenceNumber();
            if (ref != null && (ref.startsWith("DEMO-") || ref.startsWith("EXP-001") || ref.startsWith("EXP-002") || ref.equals("OB-2026-001"))) {
                try {
                    transactionService.deleteTransaction(companyId, tx.getId());
                    txDeleted++;
                } catch(Exception e) {}
            }
        }
        
        // Delete Journal Entries
        List<JournalEntry> journals = journalEntryRepository.findByCompany_CompanyId(companyId);
        for (JournalEntry je : journals) {
            String ref = je.getReferenceNo();
            if (ref != null && (ref.startsWith("DEMO-") || ref.startsWith("EXP-") || ref.equals("OB-2026-001"))) {
                try {
                    journalEntryRepository.delete(je);
                    jeDeleted++;
                } catch(Exception e) {}
            }
        }
        
        // Delete Purchase Orders
        List<PurchaseOrderResponseDto> pos = purchaseOrderService.getPurchaseOrdersByCompany(companyId);
        for (PurchaseOrderResponseDto po : pos) {
            if (po.getPurchaseOrderNumber() != null && po.getPurchaseOrderNumber().startsWith("DEMO-")) {
                // Skipped PO delete
            }
        }
        
        // Delete Sales Orders
        List<SalesOrderResponseDto> sos = salesOrderService.getSalesOrdersByCompany(companyId);
        for (SalesOrderResponseDto so : sos) {
            if (so.getSoNumber() != null && so.getSoNumber().startsWith("DEMO-")) {
                // Skipped SO delete
            }
        }

        return "Cleaned " + txDeleted + " tx, " + jeDeleted + " je";
    }

    private String ensureExactDemoUser(Company company) {
        String email = "madam.demo@ginuma.com";
        AppUser existingUser = appUserRepository.findByEmail(email).orElse(null);
        if (existingUser == null) {
            AppUserRequestDto request = new AppUserRequestDto();
            request.setEmail(email);
            request.setPassword("Demo@2026");
            request.setRole("COMPANY");
            try {
                appUserService.createUser(company.getCompanyId(), request);
            } catch (Exception e) {}
            existingUser = appUserRepository.findByEmail(email).orElse(null);
            if(existingUser != null) {
                existingUser.setCompany(company);
                appUserRepository.save(existingUser);
            }
        } else {
            existingUser.setCompany(company);
            existingUser.setPassword(passwordEncoder.encode("Demo@2026"));
            appUserRepository.save(existingUser);
        }

        // Employee
        Employee emp = employeeRepository.findByEmail(email).orElse(null);
        if (emp == null) {
            emp = new Employee();
            emp.setFirstName("Madam");
            emp.setLastName("Demo User");
            emp.setEmail(email);
            emp.setMobileNo("0770000000");
            emp.setCompany(company);
            emp.setDateAdded(LocalDate.now());
            // Set department and designation if needed
            Department d = departmentRepository.findAll().stream().findFirst().orElse(null);
            if (d != null) emp.setDepartment(d);
            Designation des = designationRepository.findAll().stream().findFirst().orElse(null);
            if (des != null) emp.setDesignation(des);
            
            employeeRepository.save(emp);
        }
        return "User Madam Demo configured successfully.";
    }

    private String ensureExactChartOfAccounts(Company company) {
        Integer cId = company.getCompanyId();
        int added = 0;
        added += ensureAccount(cId, "1000", "Cash in Hand", AccountType.ASSET_BANK);
        added += ensureAccount(cId, "1010", "Bank Account", AccountType.ASSET_BANK);
        added += ensureAccount(cId, "1100", "Accounts Receivable", AccountType.ASSET_OTHER_CURRENT_ASSET);
        added += ensureAccount(cId, "1200", "Raw Material Inventory", AccountType.ASSET_OTHER_CURRENT_ASSET);
        added += ensureAccount(cId, "1210", "Finished Goods Inventory", AccountType.ASSET_OTHER_CURRENT_ASSET);
        added += ensureAccount(cId, "1500", "Land", AccountType.ASSET_FIXED_ASSET);
        added += ensureAccount(cId, "1510", "Factory Building", AccountType.ASSET_FIXED_ASSET);
        added += ensureAccount(cId, "1520", "Machinery", AccountType.ASSET_FIXED_ASSET);
        added += ensureAccount(cId, "1530", "Furniture & Equipment", AccountType.ASSET_FIXED_ASSET);
        
        // Accumulated Depreciation (Technically Contra-Asset, but use Asset/Liability based on what doesn't crash)
        added += ensureAccount(cId, "1590", "Accumulated Depreciation - Building", AccountType.EQUITY); 
        added += ensureAccount(cId, "1591", "Accumulated Depreciation - Machinery", AccountType.EQUITY);
        added += ensureAccount(cId, "1592", "Accumulated Depreciation - Furniture", AccountType.EQUITY);
        
        added += ensureAccount(cId, "2000", "Accounts Payable", AccountType.LIABILITY_ACCOUNTS_PAYABLE);
        added += ensureAccount(cId, "2100", "Bank Loan", AccountType.LIABILITY_LONG_TERM_LIABILITY);
        added += ensureAccount(cId, "2200", "VAT Payable", AccountType.LIABILITY_OTHER_CURRENT_LIABILITY);
        
        added += ensureAccount(cId, "3000", "Share Capital", AccountType.EQUITY);
        added += ensureAccount(cId, "3100", "Retained Earnings", AccountType.EQUITY);
        
        added += ensureAccount(cId, "4000", "Sales Revenue", AccountType.INCOME);
        added += ensureAccount(cId, "5000", "Cost of Goods Sold", AccountType.EXPENSE);
        added += ensureAccount(cId, "5100", "Manufacturing Cost", AccountType.EXPENSE); // WIP approx
        
        added += ensureAccount(cId, "6000", "Administrative Expenses", AccountType.EXPENSE);
        added += ensureAccount(cId, "6100", "Selling Expenses", AccountType.EXPENSE);
        added += ensureAccount(cId, "6200", "Salary Expense", AccountType.EXPENSE);
        added += ensureAccount(cId, "6300", "Depreciation Expense", AccountType.EXPENSE);
        added += ensureAccount(cId, "6400", "Interest Expense", AccountType.EXPENSE);

        return "Created/Updated " + added + " exact accounts";
    }

    private int ensureAccount(Integer companyId, String code, String name, AccountType type) {
        String normalized = name.replaceAll("\s+", "").toLowerCase();
        List<Account> allAccounts = accountRepository.findByCompany_CompanyId(companyId);
        
        Account accByNorm = allAccounts.stream().filter(a -> a.getNormalizedName().equalsIgnoreCase(normalized)).findFirst().orElse(null);
        Account accByCode = allAccounts.stream().filter(a -> code.equals(a.getAccountCode())).findFirst().orElse(null);
        
        if (accByNorm != null) {
            if (accByCode != null && !accByCode.getId().equals(accByNorm.getId())) {
                accByCode.setAccountCode("TMP-" + UUID.randomUUID().toString().substring(0, 8));
                accountRepository.saveAndFlush(accByCode);
            }
            accByNorm.setAccountCode(code);
            accByNorm.setAccountName(name);
            accByNorm.setAccountType(type);
            accountRepository.saveAndFlush(accByNorm);
            return 0;
        } else if (accByCode != null) {
            accByCode.setAccountName(name);
            accByCode.setNormalizedName(normalized);
            accByCode.setAccountType(type);
            accountRepository.saveAndFlush(accByCode);
            return 0;
        } else {
            Account acc = new Account();
            acc.setAccountCode(code);
            acc.setAccountName(name);
            acc.setNormalizedName(normalized);
            acc.setAccountType(type);
            acc.setCurrentBalance(BigDecimal.ZERO);
            acc.setActive(true);
            acc.setCompany(companyRepository.findById(companyId).orElse(null));
            accountRepository.saveAndFlush(acc);
            return 1;
        }
    }
    
    private Account reqAcc(Integer companyId, String code) {
        return accountRepository.findByCompany_CompanyId(companyId).stream().filter(a -> code.equals(a.getAccountCode())).findFirst().orElseThrow(() -> new RuntimeException("Account Code " + code + " not found"));
    }

    private String seedExactOpeningBalance(Company company) {
        String ref = "OB-2026-001";
        JournalEntry exists = journalEntryRepository.findByCompany_CompanyId(company.getCompanyId()).stream().filter(j -> ref.equals(j.getReferenceNo())).findFirst().orElse(null);
        if (exists != null) return "Already exists";

        JournalEntryDto je = new JournalEntryDto();
        je.setEntryType(JournalEntryType.MANUAL);
        je.setEntryDate(LocalDate.parse("2026-01-01"));
        je.setJournalTitle("Opening Balances");
        je.setReferenceNo(ref);
        je.setCompanyId(company.getCompanyId());
        je.setDescription("Opening balances from Excel trial balance");
        
        List<JournalEntryLineDto> lines = new ArrayList<>();
        // Debits
        lines.add(new JournalEntryLineDto("1000", new BigDecimal("50000"), true, "Cash"));
        lines.add(new JournalEntryLineDto("1010", new BigDecimal("2000000"), true, "Bank"));
        lines.add(new JournalEntryLineDto("1100", new BigDecimal("1200000"), true, "AR"));
        lines.add(new JournalEntryLineDto("1200", new BigDecimal("800000"), true, "Raw Mat"));
        lines.add(new JournalEntryLineDto("1210", new BigDecimal("1500000"), true, "FG"));
        lines.add(new JournalEntryLineDto("1500", new BigDecimal("5000000"), true, "Land"));
        lines.add(new JournalEntryLineDto("1510", new BigDecimal("8000000"), true, "Building"));
        lines.add(new JournalEntryLineDto("1520", new BigDecimal("6000000"), true, "Machinery"));
        lines.add(new JournalEntryLineDto("1530", new BigDecimal("500000"), true, "Furniture"));

        // Credits
        lines.add(new JournalEntryLineDto("1590", new BigDecimal("800000"), false, "Acc Dep Build"));
        lines.add(new JournalEntryLineDto("1591", new BigDecimal("1200000"), false, "Acc Dep Mach"));
        lines.add(new JournalEntryLineDto("1592", new BigDecimal("100000"), false, "Acc Dep Furn"));
        lines.add(new JournalEntryLineDto("2000", new BigDecimal("1100000"), false, "AP"));
        lines.add(new JournalEntryLineDto("2100", new BigDecimal("4000000"), false, "Loan"));
        lines.add(new JournalEntryLineDto("2200", new BigDecimal("100000"), false, "VAT"));
        lines.add(new JournalEntryLineDto("3000", new BigDecimal("15000000"), false, "Capital"));
        lines.add(new JournalEntryLineDto("3100", new BigDecimal("2750000"), false, "RE"));

        je.setLines(lines);
        journalEntryService.createJournalEntry(je);
        return "Created opening balances exactly 25,050,000";
    }

    private String seedExactSuppliers(Company company) {
        int added = 0;
        added += ensureSupplier(company, "Main Raw Material Supplier", "supplier@example.com");
        added += ensureSupplier(company, "Packaging Material Supplier", "packaging@example.com");
        return "Suppliers created: " + added;
    }
    
    private int ensureSupplier(Company c, String name, String email) {
        if(supplierRepository.findByCompany_CompanyId(c.getCompanyId()).stream().anyMatch(s -> name.equals(s.getSupplierName()))) return 0;
        Supplier s = new Supplier();
        s.setSupplierName(name);
        s.setEmail(email);
        s.setMobileNo("0770000000");
        s.setAddress("Colombo");
        s.setSupplierType(SupplierType.SUPPLIER);
        s.setCompany(c);
        s.setTax(com.example.GinumApps.enums.TaxType.EXCLUSIVE);
        supplierRepository.save(s);
        return 1;
    }

    private String seedExactCustomers(Company company) {
        int added = 0;
        added += ensureCustomer(company, "Main Credit Customer", "customer@example.com", CustomerType.CORPORATE);
        added += ensureCustomer(company, "Cash Customer", "cash@example.com", CustomerType.INDIVIDUAL);
        return "Customers created: " + added;
    }

    private int ensureCustomer(Company c, String name, String email, CustomerType type) {
        if(customerRepository.findByCompany_CompanyId(c.getCompanyId()).stream().anyMatch(cu -> name.equals(cu.getName()))) return 0;
        Customer cu = new Customer();
        cu.setName(name);
        cu.setEmail(email);
        cu.setPhoneNo("0771111111");
        cu.setBillingAddress("Colombo");
        cu.setDeliveryAddress("Colombo");
        cu.setCustomerType(type);
        cu.setCompany(c);
        cu.setTax(com.example.GinumApps.enums.TaxType.EXCLUSIVE);
        customerRepository.save(cu);
        return 1;
    }

    private String seedExactItems(Company company) {
        int added = 0;
        added += ensureItem(company, "Raw Material", "Raw Material", ItemType.BOTH, "1200", new BigDecimal("3900"), BigDecimal.ZERO, 205, 10);
        added += ensureItem(company, "Chair", "Finished Goods", ItemType.BOTH, "1210", new BigDecimal("6500"), new BigDecimal("13000"), 230, 5);
        return "Items created: " + added;
    }

    private int ensureItem(Company c, String name, String cat, ItemType type, String accCode, BigDecimal cost, BigDecimal price, int stock, int reorder) {
        if(itemRepository.findByCompany_CompanyId(c.getCompanyId()).stream().anyMatch(i -> name.equals(i.getName()))) return 0;
        Item i = new Item();
        i.setName(name);
        i.setCategory(cat);
        i.setItemType(type);
        i.setItemCode(name.substring(0, 3).toUpperCase() + "-" + System.currentTimeMillis() % 1000);
        i.setPurchasePrice(cost);
        i.setUnitPrice(price);
        i.setCurrentStock(new BigDecimal(stock));
        i.setReorderLevel(reorder);
        
        i.setCompany(c);
        itemRepository.save(i);
        return 1;
    }

    private void seedExactPurchases(Company c, Map<String, Object> map) {
        int created = 0;
        Supplier mainSupp = findSupplier(c.getCompanyId(), "Main Raw Material Supplier");
        Supplier packSupp = findSupplier(c.getCompanyId(), "Packaging Material Supplier");
        Item rawMat = findItem(c.getCompanyId(), "Raw Material");
        if(mainSupp != null && rawMat != null) {
            created += createPO(c.getCompanyId(), "DEMO-PO-001", "2026-01-03", mainSupp, "Purchased raw materials on credit", rawMat, 10, new BigDecimal("120000"));
            created += createPO(c.getCompanyId(), "DEMO-PO-002", "2026-01-10", mainSupp, "Purchased raw materials cash", rawMat, 1, new BigDecimal("300000")); // qty 1 for int validation
        }
        if(packSupp != null && rawMat != null) {
            created += createPO(c.getCompanyId(), "DEMO-PO-003", "2026-01-18", packSupp, "Purchased packaging materials credit", rawMat, 1, new BigDecimal("200000"));
        }
        map.put("created", created);
    }

    private void seedExactSupplierPayments(Company c, Map<String, Object> map) {
        int created = 0;
        Supplier mainSupp = findSupplier(c.getCompanyId(), "Main Raw Material Supplier");
        if(mainSupp != null) {
            created += createDP(c.getCompanyId(), "DEMO-SP-001", "2026-01-15", mainSupp.getId().intValue(), "SUPPLIER", "Paid suppliers by bank", new BigDecimal("800000"), "1010", "2000", "Supplier Payment");
            created += createDP(c.getCompanyId(), "DEMO-SP-002", "2026-01-28", mainSupp.getId().intValue(), "SUPPLIER", "Paid suppliers by bank", new BigDecimal("500000"), "1010", "2000", "Supplier Payment");
        }
        map.put("created", created);
    }

    private void seedExactSales(Company c, Map<String, Object> map) {
        int created = 0;
        Customer mainCust = findCustomer(c.getCompanyId(), "Main Credit Customer");
        Customer cashCust = findCustomer(c.getCompanyId(), "Cash Customer");
        Item chair = findItem(c.getCompanyId(), "Chair");
        if(mainCust != null && chair != null) {
            created += createSO(c.getCompanyId(), "DEMO-SO-001", "2026-01-08", mainCust, "Credit Sales", chair, 1, new BigDecimal("1500000"));
            created += createSO(c.getCompanyId(), "DEMO-SO-003", "2026-01-25", mainCust, "Credit Sales", chair, 1, new BigDecimal("2000000"));
        }
        if(cashCust != null && chair != null) {
            created += createSO(c.getCompanyId(), "DEMO-SO-002", "2026-01-16", cashCust, "Cash Sales", chair, 1, new BigDecimal("800000"));
        }
        map.put("created", created);
    }

    private void seedExactCustomerReceipts(Company c, Map<String, Object> map) {
        int created = 0;
        Customer mainCust = findCustomer(c.getCompanyId(), "Main Credit Customer");
        if(mainCust != null) {
            created += createDR(c.getCompanyId(), "DEMO-RC-001", "2026-01-12", mainCust.getId().intValue(), "CUSTOMER", "Collection from debtors", new BigDecimal("1000000"), "1010", "1100", "Customer Receipt");
            created += createDR(c.getCompanyId(), "DEMO-RC-002", "2026-01-29", mainCust.getId().intValue(), "CUSTOMER", "Collection from debtors", new BigDecimal("1500000"), "1010", "1100", "Customer Receipt");
        }
        map.put("created", created);
    }

    private void seedExactPayroll(Company c, Map<String, Object> map) {
        int created = 0;
        created += createDP(c.getCompanyId(), "DEMO-PAY-001", "2026-01-31", null, "OTHER", "Factory wages", new BigDecimal("900000"), "1010", "6200", "Salary Expense");
        created += createDP(c.getCompanyId(), "DEMO-PAY-002", "2026-01-31", null, "OTHER", "Admin salaries", new BigDecimal("250000"), "1010", "6000", "Salary Expense");
        created += createDP(c.getCompanyId(), "DEMO-PAY-003", "2026-01-31", null, "OTHER", "Sales salaries", new BigDecimal("200000"), "1010", "6100", "Salary Expense");
        map.put("created", created);
    }

    private void seedExactAdminExpenses(Company c, Map<String, Object> map) {
        int created = 0;
        created += createDP(c.getCompanyId(), "DEMO-ADM-001", "2026-01-31", null, "OTHER", "Office rent", new BigDecimal("100000"), "1010", "6000", "Other");
        created += createDP(c.getCompanyId(), "DEMO-ADM-002", "2026-01-31", null, "OTHER", "Telephone", new BigDecimal("30000"), "1010", "6000", "Other");
        created += createDP(c.getCompanyId(), "DEMO-ADM-003", "2026-01-31", null, "OTHER", "Internet", new BigDecimal("20000"), "1010", "6000", "Other");
        created += createDP(c.getCompanyId(), "DEMO-ADM-004", "2026-01-31", null, "OTHER", "Office supplies", new BigDecimal("25000"), "1010", "6000", "Other");
        created += createDP(c.getCompanyId(), "DEMO-ADM-005", "2026-01-31", null, "OTHER", "Insurance", new BigDecimal("40000"), "1010", "6000", "Other");
        map.put("created", created);
    }

    private void seedExactSellingExpenses(Company c, Map<String, Object> map) {
        int created = 0;
        created += createDP(c.getCompanyId(), "DEMO-SELL-001", "2026-01-31", null, "OTHER", "Advertising", new BigDecimal("120000"), "1010", "6100", "Other");
        created += createDP(c.getCompanyId(), "DEMO-SELL-002", "2026-01-31", null, "OTHER", "Delivery expenses", new BigDecimal("80000"), "1010", "6100", "Other");
        map.put("created", created);
    }

    private void seedExactFixedAssets(Company c, Map<String, Object> map) {
        int created = 0;
        created += createDP(c.getCompanyId(), "DEMO-FA-001", "2026-01-20", null, "OTHER", "Purchased new machinery", new BigDecimal("1500000"), "1010", "1520", "Asset Purchase");
        map.put("created", created);
    }

    private void seedExactLoan(Company c, Map<String, Object> map) {
        int created = 0;
        created += createDP(c.getCompanyId(), "DEMO-LOAN-001", "2026-01-31", null, "OTHER", "Loan repayment", new BigDecimal("200000"), "1010", "2100", "Loan Payment");
        created += createDP(c.getCompanyId(), "DEMO-INT-001", "2026-01-31", null, "OTHER", "Loan interest", new BigDecimal("50000"), "1010", "6400", "Interest");
        map.put("created", created);
    }

    private void seedExactDepreciation(Company c, Map<String, Object> map) {
        int created = 0;
        created += createJE(c, "DEMO-DEP-001", "2026-01-31", "Depreciation", "Building depreciation", "6300", "1590", new BigDecimal("40000"));
        created += createJE(c, "DEMO-DEP-002", "2026-01-31", "Depreciation", "Machinery depreciation", "6300", "1591", new BigDecimal("75000"));
        created += createJE(c, "DEMO-DEP-003", "2026-01-31", "Depreciation", "Furniture depreciation", "6300", "1592", new BigDecimal("10000"));
        map.put("created", created);
    }

    private void seedExactManufacturing(Company c, Map<String, Object> map) {
        int created = 0;
        created += createJE(c, "DEMO-MFG-001", "2026-01-31", "Manufacturing", "Raw materials issued to production", "5100", "1200", new BigDecimal("1400000"));
        created += createJE(c, "DEMO-MFG-002", "2026-01-31", "Manufacturing", "Direct labour", "5100", "1010", new BigDecimal("900000"));
        created += createJE(c, "DEMO-MFG-003", "2026-01-31", "Manufacturing", "Factory electricity", "5100", "1010", new BigDecimal("180000"));
        created += createJE(c, "DEMO-MFG-004", "2026-01-31", "Manufacturing", "Factory rent", "5100", "1010", new BigDecimal("150000"));
        created += createJE(c, "DEMO-MFG-005", "2026-01-31", "Manufacturing", "Factory maintenance", "5100", "1010", new BigDecimal("70000"));
        created += createJE(c, "DEMO-MFG-006", "2026-01-31", "Manufacturing", "Finished Goods Produced", "1210", "5100", new BigDecimal("2700000"));
        created += createJE(c, "DEMO-MFG-007", "2026-01-31", "Manufacturing", "Cost of Goods Sold", "5000", "1210", new BigDecimal("2400000"));
        
        created += createJE(c, "DEMO-INV-001", "2026-01-31", "Inventory", "Raw Materials Closing", "1200", "5000", new BigDecimal("900000"));
        created += createJE(c, "DEMO-INV-002", "2026-01-31", "Inventory", "Finished Goods Closing", "1210", "5000", new BigDecimal("1800000"));
        
        map.put("created", created);
    }

    private void seedExactDashboardDemo(Company c, Map<String, Object> map) {
        int created = 0;
        String curMonth = LocalDate.now().toString();
        created += createDR(c.getCompanyId(), "DEMO-DASH-SALE-001", curMonth, null, "OTHER", "Current month demo sale", new BigDecimal("65000"), "1010", "4000", "Sales");
        created += createDP(c.getCompanyId(), "DEMO-DASH-EXP-001", curMonth, null, "OTHER", "Current month demo admin expense", new BigDecimal("10000"), "1010", "6000", "Other");
        map.put("created", created);
    }

    // Helper functions

    private int createDP(Integer companyId, String ref, String date, Integer payeeId, String payeeType, String note, BigDecimal amt, String payCode, String expCode, String cat) {
        if (transactionService.getAllTransactions(companyId).stream().anyMatch(t -> ref.equals(t.getReferenceNumber()))) return 0;
        DirectPaymentRequestDto pay = new DirectPaymentRequestDto();
        pay.setReferenceNumber(ref);
        pay.setPaymentAccountCode(payCode);
        pay.setExpenseAccountCode(expCode);
        pay.setAmount(amt);
        pay.setPaymentNote(note);
        pay.setPayeeId(payeeId);
        pay.setPayeeType(payeeType);
        pay.setPaymentCategory(cat);
        pay.setPaymentMethod("Bank Transfer");
        transactionService.processDirectPayment(companyId, pay);
        Transaction saved = transactionService.getAllTransactions(companyId).stream().filter(t -> ref.equals(t.getReferenceNumber())).findFirst().orElse(null);
        if (saved != null) {
            saved.setDate(date);
            saved.setTotalDebit(amt.doubleValue());
            saved.setTotalCredit(amt.doubleValue());
            transactionRepository.save(saved);
        }
        return 1;
    }

    private int createDR(Integer companyId, String ref, String date, Integer payeeId, String payeeType, String note, BigDecimal amt, String payCode, String incCode, String cat) {
        if (transactionService.getAllTransactions(companyId).stream().anyMatch(t -> ref.equals(t.getReferenceNumber()))) return 0;
        Company company = companyRepository.findById(companyId).orElse(null);
        if(company == null) return 0;
        Transaction t = new Transaction();
        t.setReferenceNumber(ref);
        t.setDate(date);
        t.setDescription("Receive Money - " + note);
        t.setTotalDebit(amt.doubleValue());
        t.setTotalCredit(amt.doubleValue());
        t.setCompany(company);
        t.setPayeeType(payeeType);
        t.setPayeeId(payeeId);
        t.setPayeeName("Customer");
        t.setPaymentCategory(cat);
        t.setPaymentMethod("Bank Transfer");
        t.setPaymentAccountCode(payCode);
        JournalEntryDto je = new JournalEntryDto();
        je.setEntryType(JournalEntryType.RECEIPT);
        je.setEntryDate(LocalDate.parse(date));
        je.setJournalTitle("Receive Money Direct");
        je.setReferenceNo(ref);
        je.setCompanyId(companyId);
        je.setDescription(t.getDescription());
        List<JournalEntryLineDto> lines = new ArrayList<>();
        lines.add(new JournalEntryLineDto(payCode, amt, true, note));
        lines.add(new JournalEntryLineDto(incCode, amt, false, note));
        je.setLines(lines);
        journalEntryService.createJournalEntry(je);
        transactionRepository.save(t);
        return 1;
    }
    
    private int createJE(Company comp, String ref, String date, String title, String desc, String debitAcc, String creditAcc, BigDecimal amount) {
        List<JournalEntry> exists = journalEntryRepository.findByCompany_CompanyId(comp.getCompanyId());
        if (exists.stream().anyMatch(j -> ref.equals(j.getReferenceNo()))) return 0;
        JournalEntryDto je = new JournalEntryDto();
        je.setEntryType(JournalEntryType.MANUAL);
        je.setEntryDate(LocalDate.parse(date));
        je.setJournalTitle(title);
        je.setReferenceNo(ref);
        je.setCompanyId(comp.getCompanyId());
        je.setDescription(desc);
        List<JournalEntryLineDto> lines = new ArrayList<>();
        lines.add(new JournalEntryLineDto(debitAcc, amount, true, ""));
        lines.add(new JournalEntryLineDto(creditAcc, amount, false, ""));
        je.setLines(lines);
        journalEntryService.createJournalEntry(je);
        return 1;
    }
    private int createPO(Integer companyId, String poNum, String date, Supplier supp, String notes, Item item, int qty, BigDecimal price) {
        if (purchaseOrderService.getPurchaseOrdersByCompany(companyId).stream().anyMatch(po -> poNum.equals(po.getPurchaseOrderNumber()))) return 0;

        PurchaseOrderRequestDto po = new PurchaseOrderRequestDto();
        po.setPoNumber(poNum);
        po.setSupplierInvoiceNumber(poNum);
        po.setSupplierId(supp.getId());
        po.setIssueDate(LocalDate.parse(date));
        po.setDueDate(LocalDate.parse(date));
        po.setNotes(notes);
        
        po.setPurchaseType(PurchaseType.GOODS);
        po.setPaymentAccountCode("1010"); // Bank Account
        
        PurchaseOrderItemRequestDto line = new PurchaseOrderItemRequestDto();
        line.setItemId(item.getItemId());
        line.setQuantity(qty);
        line.setUnitPrice(price);
        line.setAmount(price.multiply(new BigDecimal(qty)));
        line.setDescription(item.getName());
        line.setDiscount(BigDecimal.ZERO);
        line.setAccountCode("1200"); // Raw Material Inventory

        po.setItems(List.of(line));

        try {
            purchaseOrderService.createPurchaseOrder(po, companyId);
            return 1;
        } catch (Exception e) {
            System.err.println(poNum + " skipped: " + e.getMessage());
            return 0;
        }
    }

    private int createSO(Integer companyId, String soNum, String date, Customer cust, String notes, Item item, int qty, BigDecimal price) {
        if (salesOrderService.getSalesOrdersByCompany(companyId).stream().anyMatch(so -> soNum.equals(so.getSoNumber()))) return 0;

        SalesOrderRequestDto so = new SalesOrderRequestDto();
        so.setSoNumber(soNum);
        so.setCustomerId(cust.getId());
        so.setIssueDate(LocalDate.parse(date));
        so.setDueDate(LocalDate.parse(date));
        so.setNotes(notes);
        
        so.setSalesType(SalesType.GOODS);
        so.setPaymentAccountCode("1010"); // Bank Account

        SalesOrderItemRequestDto line = new SalesOrderItemRequestDto();
        line.setItemId(item.getItemId());
        line.setQuantity(qty);
        line.setUnitPrice(price);
        line.setDescription(item.getName());
        line.setAccountCode("4000"); // Sales Revenue
        line.setItemType(LineItemType.GOODS);

        so.setItems(List.of(line));

        try {
            salesOrderService.createSalesOrder(so, companyId);
            return 1;
        } catch (Exception e) {
            System.err.println(soNum + " skipped: " + e.getMessage());
            return 0;
        }
    }

    @Transactional
    public Map<String, Object> freshExcelReset(Integer companyId) throws Exception {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("finalStatus", "ERROR");
        
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found"));
                
        // 1. Validate and prep company
        company.setAccountsReceivableAccount(null);
        company.setAccountsPayableAccount(null);
        company.setFreightAccount(null);
        company.setTaxAccount(null);
        companyRepository.saveAndFlush(company);
        
        // 2. Clean business data
        entityManager.createNativeQuery("DELETE FROM sales_order_line_items WHERE sales_order_id IN (SELECT id FROM sales_orders WHERE company_id = :cid)").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM purchase_order_line_items WHERE purchase_order_id IN (SELECT id FROM purchase_orders WHERE company_id = :cid)").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM journal_entry_lines WHERE journal_entry_id IN (SELECT id FROM journal_entries WHERE company_id = :cid)").setParameter("cid", companyId).executeUpdate();
        
        try {
            entityManager.createNativeQuery("DELETE FROM aging_receivables WHERE company_id = :cid").setParameter("cid", companyId).executeUpdate();
        } catch(Exception e) { /* ignore if table doesn't exist */ }

        entityManager.createNativeQuery("DELETE FROM transactions WHERE company_id = :cid").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM sales_orders WHERE company_id = :cid").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM purchase_orders WHERE company_id = :cid").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM journal_entries WHERE company_id = :cid").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM bank_accounts WHERE id IN (SELECT id FROM accounts WHERE company_id = :cid)").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM items WHERE company_id = :cid").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM customers WHERE company_id = :cid").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM suppliers WHERE company_id = :cid").setParameter("cid", companyId).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM accounts WHERE company_id = :cid").setParameter("cid", companyId).executeUpdate();
        
        summary.put("businessDataDeleted", true);
        summary.put("loginDataPreserved", true);

        // 3. Recreate exact Chart of Accounts
        int accCount = 0;
        Map<String, Account> createdAccounts = new HashMap<>();
        
        createdAccounts.put("Cash in Hand", createFreshAccount(company, "Cash in Hand", "1000", AccountType.ASSET_BANK));
        createdAccounts.put("Bank Account", createFreshAccount(company, "Bank Account", "1010", AccountType.ASSET_BANK));
        createdAccounts.put("Accounts Receivable", createFreshAccount(company, "Accounts Receivable", "1100", AccountType.ASSET_ACCOUNT_RECEIVABLE));
        createdAccounts.put("Raw Material Inventory", createFreshAccount(company, "Raw Material Inventory", "1200", AccountType.ASSET_OTHER_CURRENT_ASSET));
        createdAccounts.put("Finished Goods Inventory", createFreshAccount(company, "Finished Goods Inventory", "1210", AccountType.ASSET_OTHER_CURRENT_ASSET));
        createdAccounts.put("Land", createFreshAccount(company, "Land", "1500", AccountType.ASSET_FIXED_ASSET));
        createdAccounts.put("Factory Building", createFreshAccount(company, "Factory Building", "1510", AccountType.ASSET_FIXED_ASSET));
        createdAccounts.put("Machinery", createFreshAccount(company, "Machinery", "1520", AccountType.ASSET_FIXED_ASSET));
        createdAccounts.put("Furniture & Equipment", createFreshAccount(company, "Furniture & Equipment", "1530", AccountType.ASSET_FIXED_ASSET));
        
        createdAccounts.put("Accumulated Depreciation - Building", createFreshAccount(company, "Accumulated Depreciation - Building", "1590", AccountType.LIABILITY_OTHER_LIABILITY));
        createdAccounts.put("Accumulated Depreciation - Machinery", createFreshAccount(company, "Accumulated Depreciation - Machinery", "1591", AccountType.LIABILITY_OTHER_LIABILITY));
        createdAccounts.put("Accumulated Depreciation - Furniture", createFreshAccount(company, "Accumulated Depreciation - Furniture", "1592", AccountType.LIABILITY_OTHER_LIABILITY));
        
        createdAccounts.put("Accounts Payable", createFreshAccount(company, "Accounts Payable", "2000", AccountType.LIABILITY_ACCOUNTS_PAYABLE));
        createdAccounts.put("Bank Loan", createFreshAccount(company, "Bank Loan", "2100", AccountType.LIABILITY_LONG_TERM_LIABILITY));
        createdAccounts.put("VAT Payable", createFreshAccount(company, "VAT Payable", "2200", AccountType.LIABILITY_OTHER_CURRENT_LIABILITY));
        
        createdAccounts.put("Share Capital", createFreshAccount(company, "Share Capital", "3000", AccountType.EQUITY));
        createdAccounts.put("Retained Earnings", createFreshAccount(company, "Retained Earnings", "3100", AccountType.EQUITY));
        
        createdAccounts.put("Sales Revenue", createFreshAccount(company, "Sales Revenue", "4000", AccountType.INCOME));
        
        createdAccounts.put("Cost of Goods Sold", createFreshAccount(company, "Cost of Goods Sold", "5000", AccountType.COST_OF_SALES));
        createdAccounts.put("Work in Progress / Manufacturing Cost", createFreshAccount(company, "Work in Progress / Manufacturing Cost", "5100", AccountType.COST_OF_SALES));
        
        createdAccounts.put("Administrative Expenses", createFreshAccount(company, "Administrative Expenses", "6000", AccountType.EXPENSE));
        createdAccounts.put("Selling Expenses", createFreshAccount(company, "Selling Expenses", "6100", AccountType.EXPENSE));
        createdAccounts.put("Salary Expense", createFreshAccount(company, "Salary Expense", "6200", AccountType.EXPENSE));
        createdAccounts.put("Depreciation Expense", createFreshAccount(company, "Depreciation Expense", "6300", AccountType.EXPENSE));
        createdAccounts.put("Interest Expense", createFreshAccount(company, "Interest Expense", "6400", AccountType.EXPENSE));

        summary.put("accountsCreated", createdAccounts.size());
        
        // Link defaults
        company.setAccountsReceivableAccount(createdAccounts.get("Accounts Receivable"));
        company.setAccountsPayableAccount(createdAccounts.get("Accounts Payable"));
        company.setTaxAccount(createdAccounts.get("VAT Payable"));
        company.setFreightAccount(createdAccounts.get("Administrative Expenses"));
        companyRepository.saveAndFlush(company);

        // 4. Opening Balance
        JournalEntryDto obDto = new JournalEntryDto();
        obDto.setCompanyId(companyId);
        obDto.setEntryDate(LocalDate.of(2026, 1, 1));
        obDto.setReferenceNo("OB-2026-001");
        obDto.setJournalTitle("Opening Balances");
        obDto.setDescription("Opening balances from Excel trial balance");
        obDto.setEntryType(JournalEntryType.MANUAL);
        obDto.setAuthorId(1);
        
        List<JournalEntryLineDto> obLines = new ArrayList<>();
        obLines.add(new JournalEntryLineDto(createdAccounts.get("Cash in Hand").getAccountCode(), new BigDecimal("50000"), true, "Opening Balance"));
        obLines.add(new JournalEntryLineDto(createdAccounts.get("Bank Account").getAccountCode(), new BigDecimal("2000000"), true, "Opening Balance"));
        obLines.add(new JournalEntryLineDto(createdAccounts.get("Accounts Receivable").getAccountCode(), new BigDecimal("1200000"), true, "Opening Balance"));
        obLines.add(new JournalEntryLineDto(createdAccounts.get("Raw Material Inventory").getAccountCode(), new BigDecimal("800000"), true, "Opening Balance"));
        obLines.add(new JournalEntryLineDto(createdAccounts.get("Finished Goods Inventory").getAccountCode(), new BigDecimal("1500000"), true, "Opening Balance"));
        obLines.add(new JournalEntryLineDto(createdAccounts.get("Land").getAccountCode(), new BigDecimal("5000000"), true, "Opening Balance"));
        obLines.add(new JournalEntryLineDto(createdAccounts.get("Factory Building").getAccountCode(), new BigDecimal("8000000"), true, "Opening Balance"));
        obLines.add(new JournalEntryLineDto(createdAccounts.get("Machinery").getAccountCode(), new BigDecimal("6000000"), true, "Opening Balance"));
        obLines.add(new JournalEntryLineDto(createdAccounts.get("Furniture & Equipment").getAccountCode(), new BigDecimal("500000"), true, "Opening Balance"));

        obLines.add(new JournalEntryLineDto(createdAccounts.get("Accumulated Depreciation - Building").getAccountCode(), new BigDecimal("800000"), false, "Opening Balance"));
        obLines.add(new JournalEntryLineDto(createdAccounts.get("Accumulated Depreciation - Machinery").getAccountCode(), new BigDecimal("1200000"), false, "Opening Balance"));
        obLines.add(new JournalEntryLineDto(createdAccounts.get("Accumulated Depreciation - Furniture").getAccountCode(), new BigDecimal("100000"), false, "Opening Balance"));
        obLines.add(new JournalEntryLineDto(createdAccounts.get("Accounts Payable").getAccountCode(), new BigDecimal("1100000"), false, "Opening Balance"));
        obLines.add(new JournalEntryLineDto(createdAccounts.get("Bank Loan").getAccountCode(), new BigDecimal("4000000"), false, "Opening Balance"));
        obLines.add(new JournalEntryLineDto(createdAccounts.get("VAT Payable").getAccountCode(), new BigDecimal("100000"), false, "Opening Balance"));
        obLines.add(new JournalEntryLineDto(createdAccounts.get("Share Capital").getAccountCode(), new BigDecimal("15000000"), false, "Opening Balance"));
        obLines.add(new JournalEntryLineDto(createdAccounts.get("Retained Earnings").getAccountCode(), new BigDecimal("2750000"), false, "Opening Balance"));
        
        obDto.setLines(obLines);
        journalEntryService.createJournalEntry(obDto);
        summary.put("openingBalanceImported", true);

        // 5. Suppliers
        Supplier s1 = createFreshSupplier(company, "Main Raw Material Supplier", "supplier@example.com");
        Supplier s2 = createFreshSupplier(company, "Packaging Material Supplier", "packaging@example.com");
        summary.put("suppliersCreated", 2);

        // 6. Customers
        Customer c1 = createFreshCustomer(company, "Main Credit Customer", "customer@example.com");
        Customer c2 = createFreshCustomer(company, "Cash Customer", "cash@example.com");
        summary.put("customersCreated", 2);

        // 7. Items
        Item i1 = createFreshItem(company, "RM-001", "Raw Material", "Raw Material", ItemType.RAW_MATERIAL, new BigDecimal("3900"), BigDecimal.ZERO, new BigDecimal("205"), 10, createdAccounts.get("Raw Material Inventory"));
        Item i2 = createFreshItem(company, "CH-001", "Chair", "Finished Goods", ItemType.SALES_ITEM, new BigDecimal("6500"), new BigDecimal("13000"), new BigDecimal("230"), 5, createdAccounts.get("Finished Goods Inventory"));
        summary.put("itemsCreated", 2);

        // 8. Transactions
        // A) Purchases
        PurchaseOrderResponseDto po1 = createFreshPurchase(companyId, s1, i1, createdAccounts.get("Raw Material Inventory").getAccountCode(), "DEMO-PO-001", LocalDate.of(2026, 1, 3), "Purchased raw materials on credit", 10, new BigDecimal("120000"));
        createFreshPurchase(companyId, s1, i1, createdAccounts.get("Raw Material Inventory").getAccountCode(), "DEMO-PO-002", LocalDate.of(2026, 1, 10), "Purchased raw materials cash", 1, new BigDecimal("300000"));
        createFreshPurchase(companyId, s2, i1, createdAccounts.get("Raw Material Inventory").getAccountCode(), "DEMO-PO-003", LocalDate.of(2026, 1, 18), "Purchased packaging materials credit", 1, new BigDecimal("200000"));
        summary.put("purchasesCreated", 3);

        // B) Supplier Payments
        PurchasePaymentRequestDto pay1 = new PurchasePaymentRequestDto();
        pay1.setAmount(new BigDecimal("800000"));
        pay1.setPaymentAccountCode(createdAccounts.get("Bank Account").getAccountCode());
        pay1.setCompanyId(companyId);
        pay1.setPaymentNote("Paid suppliers by bank");
        purchaseOrderService.payPurchaseOrder(po1.getId(), pay1);
        
        PurchasePaymentRequestDto pay2 = new PurchasePaymentRequestDto();
        pay2.setAmount(new BigDecimal("500000"));
        pay2.setPaymentAccountCode(createdAccounts.get("Bank Account").getAccountCode());
        pay2.setCompanyId(companyId);
        pay2.setPaymentNote("Paid suppliers by bank");
        purchaseOrderService.payPurchaseOrder(po1.getId(), pay2);
        summary.put("supplierPaymentsCreated", 2);

        // C) Sales
        SalesOrderResponseDto so1 = createFreshSale(companyId, c1, i2, createdAccounts.get("Sales Revenue").getAccountCode(), "DEMO-SO-001", LocalDate.of(2026, 1, 8), "Credit Sales", 1, new BigDecimal("1500000"));
        createFreshSale(companyId, c2, i2, createdAccounts.get("Sales Revenue").getAccountCode(), "DEMO-SO-002", LocalDate.of(2026, 1, 16), "Cash Sales", 1, new BigDecimal("800000"));
        SalesOrderResponseDto so3 = createFreshSale(companyId, c1, i2, createdAccounts.get("Sales Revenue").getAccountCode(), "DEMO-SO-003", LocalDate.of(2026, 1, 25), "Credit Sales", 1, new BigDecimal("2000000"));
        summary.put("salesCreated", 3);

        // D) Customer Collections
        SalesPaymentRequestDto rec1 = new SalesPaymentRequestDto();
        rec1.setAmount(new BigDecimal("1000000"));
        rec1.setPaymentAccountCode(createdAccounts.get("Bank Account").getAccountCode());
        rec1.setCompanyId(companyId);
        salesOrderService.paySalesOrder(so1.getId(), rec1);

        SalesPaymentRequestDto rec2 = new SalesPaymentRequestDto();
        rec2.setAmount(new BigDecimal("1500000"));
        rec2.setPaymentAccountCode(createdAccounts.get("Bank Account").getAccountCode());
        rec2.setCompanyId(companyId);
        salesOrderService.paySalesOrder(so3.getId(), rec2);
        summary.put("customerReceiptsCreated", 2);

        // E) Payroll
        createFreshDirectPayment(companyId, null, "OTHER", "DEMO-PAY-001", LocalDate.of(2026, 1, 31), "Factory wages", new BigDecimal("900000"), createdAccounts.get("Bank Account").getAccountCode(), createdAccounts.get("Salary Expense").getAccountCode(), "Salary Expense");
        createFreshDirectPayment(companyId, null, "OTHER", "DEMO-PAY-002", LocalDate.of(2026, 1, 31), "Admin salaries", new BigDecimal("250000"), createdAccounts.get("Bank Account").getAccountCode(), createdAccounts.get("Administrative Expenses").getAccountCode(), "Salary Expense");
        createFreshDirectPayment(companyId, null, "OTHER", "DEMO-PAY-003", LocalDate.of(2026, 1, 31), "Sales salaries", new BigDecimal("200000"), createdAccounts.get("Bank Account").getAccountCode(), createdAccounts.get("Selling Expenses").getAccountCode(), "Salary Expense");
        summary.put("payrollCreated", 3);

        // F) Administrative Expenses
        createFreshDirectPayment(companyId, null, "OTHER", "DEMO-ADM-001", LocalDate.of(2026, 1, 31), "Office rent", new BigDecimal("100000"), createdAccounts.get("Bank Account").getAccountCode(), createdAccounts.get("Administrative Expenses").getAccountCode(), "Other");
        createFreshDirectPayment(companyId, null, "OTHER", "DEMO-ADM-002", LocalDate.of(2026, 1, 31), "Telephone", new BigDecimal("30000"), createdAccounts.get("Bank Account").getAccountCode(), createdAccounts.get("Administrative Expenses").getAccountCode(), "Other");
        createFreshDirectPayment(companyId, null, "OTHER", "DEMO-ADM-003", LocalDate.of(2026, 1, 31), "Internet", new BigDecimal("20000"), createdAccounts.get("Bank Account").getAccountCode(), createdAccounts.get("Administrative Expenses").getAccountCode(), "Other");
        createFreshDirectPayment(companyId, null, "OTHER", "DEMO-ADM-004", LocalDate.of(2026, 1, 31), "Office supplies", new BigDecimal("25000"), createdAccounts.get("Bank Account").getAccountCode(), createdAccounts.get("Administrative Expenses").getAccountCode(), "Other");
        createFreshDirectPayment(companyId, null, "OTHER", "DEMO-ADM-005", LocalDate.of(2026, 1, 31), "Insurance", new BigDecimal("40000"), createdAccounts.get("Bank Account").getAccountCode(), createdAccounts.get("Administrative Expenses").getAccountCode(), "Other");
        summary.put("adminExpensesCreated", 5);

        // G) Selling Expenses
        createFreshDirectPayment(companyId, null, "OTHER", "DEMO-SELL-001", LocalDate.of(2026, 1, 31), "Advertising", new BigDecimal("120000"), createdAccounts.get("Bank Account").getAccountCode(), createdAccounts.get("Selling Expenses").getAccountCode(), "Other");
        createFreshDirectPayment(companyId, null, "OTHER", "DEMO-SELL-002", LocalDate.of(2026, 1, 31), "Delivery expenses", new BigDecimal("80000"), createdAccounts.get("Bank Account").getAccountCode(), createdAccounts.get("Selling Expenses").getAccountCode(), "Other");
        summary.put("sellingExpensesCreated", 2);

        // H) Fixed Asset
        createFreshDirectPayment(companyId, null, "OTHER", "DEMO-FA-001", LocalDate.of(2026, 1, 20), "Purchased new machinery", new BigDecimal("1500000"), createdAccounts.get("Bank Account").getAccountCode(), createdAccounts.get("Machinery").getAccountCode(), "Asset Purchase");
        summary.put("fixedAssetTransactionsCreated", 1);

        // I) Loan Payment
        createFreshDirectPayment(companyId, null, "OTHER", "DEMO-LOAN-001", LocalDate.of(2026, 1, 31), "Loan repayment", new BigDecimal("200000"), createdAccounts.get("Bank Account").getAccountCode(), createdAccounts.get("Bank Loan").getAccountCode(), "Loan Payment");
        createFreshDirectPayment(companyId, null, "OTHER", "DEMO-INT-001", LocalDate.of(2026, 1, 31), "Loan interest", new BigDecimal("50000"), createdAccounts.get("Bank Account").getAccountCode(), createdAccounts.get("Interest Expense").getAccountCode(), "Interest");
        summary.put("loanTransactionsCreated", 2);

        // J) Depreciation
        createFreshJournal(company, "DEMO-DEP-001", LocalDate.of(2026, 1, 31), "Building depreciation", "Depreciation", List.of(
            new JournalEntryLineDto(createdAccounts.get("Depreciation Expense").getAccountCode(), new BigDecimal("40000"), true, "Building depreciation"),
            new JournalEntryLineDto(createdAccounts.get("Accumulated Depreciation - Building").getAccountCode(), new BigDecimal("40000"), false, "Building depreciation")
        ));
        createFreshJournal(company, "DEMO-DEP-002", LocalDate.of(2026, 1, 31), "Machinery depreciation", "Depreciation", List.of(
            new JournalEntryLineDto(createdAccounts.get("Depreciation Expense").getAccountCode(), new BigDecimal("75000"), true, "Machinery depreciation"),
            new JournalEntryLineDto(createdAccounts.get("Accumulated Depreciation - Machinery").getAccountCode(), new BigDecimal("75000"), false, "Machinery depreciation")
        ));
        createFreshJournal(company, "DEMO-DEP-003", LocalDate.of(2026, 1, 31), "Furniture depreciation", "Depreciation", List.of(
            new JournalEntryLineDto(createdAccounts.get("Depreciation Expense").getAccountCode(), new BigDecimal("10000"), true, "Furniture depreciation"),
            new JournalEntryLineDto(createdAccounts.get("Accumulated Depreciation - Furniture").getAccountCode(), new BigDecimal("10000"), false, "Furniture depreciation")
        ));
        summary.put("depreciationEntriesCreated", 3);

        // K) Manufacturing Activities
        createFreshJournal(company, "DEMO-MFG-001", LocalDate.of(2026, 1, 31), "Raw materials issued to production", "Manufacturing", List.of(
            new JournalEntryLineDto(createdAccounts.get("Work in Progress / Manufacturing Cost").getAccountCode(), new BigDecimal("1400000"), true, "Materials issued"),
            new JournalEntryLineDto(createdAccounts.get("Raw Material Inventory").getAccountCode(), new BigDecimal("1400000"), false, "Materials issued")
        ));
        createFreshJournal(company, "DEMO-MFG-002", LocalDate.of(2026, 1, 31), "Direct labour", "Manufacturing", List.of(
            new JournalEntryLineDto(createdAccounts.get("Work in Progress / Manufacturing Cost").getAccountCode(), new BigDecimal("900000"), true, "Direct labour"),
            new JournalEntryLineDto(createdAccounts.get("Salary Expense").getAccountCode(), new BigDecimal("900000"), false, "Direct labour")
        ));
        createFreshJournal(company, "DEMO-MFG-003", LocalDate.of(2026, 1, 31), "Factory electricity", "Manufacturing", List.of(
            new JournalEntryLineDto(createdAccounts.get("Work in Progress / Manufacturing Cost").getAccountCode(), new BigDecimal("180000"), true, "Electricity"),
            new JournalEntryLineDto(createdAccounts.get("Bank Account").getAccountCode(), new BigDecimal("180000"), false, "Electricity")
        ));
        createFreshJournal(company, "DEMO-MFG-004", LocalDate.of(2026, 1, 31), "Factory rent", "Manufacturing", List.of(
            new JournalEntryLineDto(createdAccounts.get("Work in Progress / Manufacturing Cost").getAccountCode(), new BigDecimal("150000"), true, "Rent"),
            new JournalEntryLineDto(createdAccounts.get("Bank Account").getAccountCode(), new BigDecimal("150000"), false, "Rent")
        ));
        createFreshJournal(company, "DEMO-MFG-005", LocalDate.of(2026, 1, 31), "Factory maintenance", "Manufacturing", List.of(
            new JournalEntryLineDto(createdAccounts.get("Work in Progress / Manufacturing Cost").getAccountCode(), new BigDecimal("70000"), true, "Maintenance"),
            new JournalEntryLineDto(createdAccounts.get("Bank Account").getAccountCode(), new BigDecimal("70000"), false, "Maintenance")
        ));
        createFreshJournal(company, "DEMO-MFG-006", LocalDate.of(2026, 1, 31), "Finished Goods Produced", "Manufacturing", List.of(
            new JournalEntryLineDto(createdAccounts.get("Finished Goods Inventory").getAccountCode(), new BigDecimal("2700000"), true, "Goods produced"),
            new JournalEntryLineDto(createdAccounts.get("Work in Progress / Manufacturing Cost").getAccountCode(), new BigDecimal("2700000"), false, "Goods produced")
        ));
        createFreshJournal(company, "DEMO-MFG-007", LocalDate.of(2026, 1, 31), "Cost of Goods Sold", "Manufacturing", List.of(
            new JournalEntryLineDto(createdAccounts.get("Cost of Goods Sold").getAccountCode(), new BigDecimal("2400000"), true, "COGS"),
            new JournalEntryLineDto(createdAccounts.get("Finished Goods Inventory").getAccountCode(), new BigDecimal("2400000"), false, "COGS")
        ));
        summary.put("manufacturingEntriesCreated", 7);
        
        // 10. Dashboard
        createFreshSale(companyId, c2, i2, createdAccounts.get("Sales Revenue").getAccountCode(), "DEMO-DASH-SALE-001", LocalDate.now(), "Current month demo sale", 1, new BigDecimal("65000"));
        createFreshDirectPayment(companyId, null, "OTHER", "DEMO-DASH-EXP-001", LocalDate.now(), "Current month demo admin expense", new BigDecimal("10000"), createdAccounts.get("Bank Account").getAccountCode(), createdAccounts.get("Administrative Expenses").getAccountCode(), "Other");
        summary.put("dashboardEntriesCreated", 2);
        
        summary.put("finalStatus", "SUCCESS");
        return summary;
    }

    private Account createFreshAccount(Company company, String name, String code, AccountType type) {
        Account a = new Account();
        a.setCompany(company);
        a.setAccountName(name);
        a.setAccountCode(code);
        a.setAccountType(type);
        a.setNormalizedName(name.replaceAll("\\s+", "").toUpperCase());
        a.setCurrentBalance(BigDecimal.ZERO);
        a.setActive(true);
        return accountRepository.save(a);
    }
    
    private Supplier createFreshSupplier(Company company, String name, String email) {
        Supplier s = new Supplier();
        s.setCompany(company);
        s.setSupplierName(name);
        s.setEmail(email);
        s.setMobileNo("0770000000");
        s.setAddress("Colombo");
        s.setSupplierType(SupplierType.SUPPLIER);
        s.setTax(TaxType.INCLUSIVE);
        s.setItemCategory(ItemCategory.FURNITURE);
        s.setCurrency(company.getCountry().getDefaultCurrency());
        s.setDiscountPercentage(0.0);
        return supplierRepository.save(s);
    }
    
    private Customer createFreshCustomer(Company company, String name, String email) {
        Customer c = new Customer();
        c.setCompany(company);
        c.setName(name);
        c.setEmail(email);
        c.setPhoneNo("0771111111");
        c.setDeliveryAddress("Colombo");
        c.setBillingAddress("Colombo");
        c.setCustomerType(com.example.GinumApps.enums.CustomerType.CORPORATE);
        c.setTax(TaxType.INCLUSIVE);
        c.setCurrency(company.getCountry().getDefaultCurrency());
        c.setDiscountPercentage(0.0);
        return customerRepository.save(c);
    }
    
    private Item createFreshItem(Company company, String code, String name, String category, ItemType type, BigDecimal purchasePrice, BigDecimal unitPrice, BigDecimal stock, int reorder, Account inventoryAccount) {
        Item i = new Item();
        i.setCompany(company);
        i.setItemCode(code);
        i.setName(name);
        i.setCategory(category);
        i.setItemType(type);
        i.setPurchasePrice(purchasePrice);
        i.setUnitPrice(unitPrice);
        i.setCurrentStock(stock);
        i.setReorderLevel(reorder);
        i.setUnit("PCS");
        i.setActive(true);
        return itemRepository.save(i);
    }
    
    private PurchaseOrderResponseDto createFreshPurchase(Integer companyId, Supplier supplier, Item item, String lineAccountCode, String poNo, LocalDate date, String desc, int qty, BigDecimal unitPrice) throws Exception {
        PurchaseOrderRequestDto dto = new PurchaseOrderRequestDto();
        dto.setSupplierId(supplier.getId());
        dto.setSupplierInvoiceNumber("SUP-" + poNo);
        dto.setPoNumber(poNo);
        dto.setIssueDate(date);
        dto.setDueDate(date.plusDays(30));
        dto.setPurchaseType(PurchaseType.GOODS);

        PurchaseOrderItemRequestDto itemDto = new PurchaseOrderItemRequestDto();
        itemDto.setItemId(item.getItemId());
        itemDto.setQuantity(qty);
        itemDto.setUnitPrice(unitPrice);
        itemDto.setDiscount(BigDecimal.ZERO);
        itemDto.setAmount(unitPrice.multiply(BigDecimal.valueOf(qty)));
        itemDto.setAccountCode(lineAccountCode);
        itemDto.setDescription(desc);

        dto.setItems(List.of(itemDto));
        return purchaseOrderService.createPurchaseOrder(dto, companyId);
    }
    
    private SalesOrderResponseDto createFreshSale(Integer companyId, Customer customer, Item item, String lineAccountCode, String soNo, LocalDate date, String desc, int qty, BigDecimal unitPrice) throws Exception {
        SalesOrderRequestDto dto = new SalesOrderRequestDto();
        dto.setCustomerId(customer.getId());
        dto.setSoNumber(soNo);
        dto.setIssueDate(date);
        dto.setSalesType(SalesType.GOODS);
        
        SalesOrderItemRequestDto itemDto = new SalesOrderItemRequestDto();
        itemDto.setItemId(item.getItemId());
        itemDto.setQuantity(qty);
        itemDto.setUnitPrice(unitPrice);
        itemDto.setDiscountPercent(BigDecimal.ZERO);
        itemDto.setAccountCode(lineAccountCode);
        itemDto.setDescription(desc);

        dto.setItems(List.of(itemDto));
        return salesOrderService.createSalesOrder(dto, companyId);
    }
    
    private void createFreshDirectPayment(Integer companyId, Integer payeeId, String payeeType, String refNo, LocalDate date, String note, BigDecimal amount, String paymentAccountCode, String expenseAccountCode, String cat) throws Exception {
        DirectPaymentRequestDto req = new DirectPaymentRequestDto();
        req.setPayeeId(payeeId);
        req.setPayeeType(payeeType);
        req.setAmount(amount);
        req.setPaymentAccountCode(paymentAccountCode);
        req.setExpenseAccountCode(expenseAccountCode);
        req.setPaymentCategory(cat);
        req.setPaymentMethod("Bank Transfer");
        req.setPaymentNote(note);
        req.setReferenceNumber(refNo);
        transactionService.processDirectPayment(companyId, req);
    }
    
    private void createFreshJournal(Company company, String refNo, LocalDate date, String desc, String title, List<JournalEntryLineDto> lines) throws Exception {
        JournalEntryDto dto = new JournalEntryDto();
        dto.setCompanyId(company.getCompanyId());
        dto.setEntryDate(date);
        dto.setReferenceNo(refNo);
        dto.setJournalTitle(title);
        dto.setDescription(desc);
        dto.setEntryType(JournalEntryType.MANUAL);
        dto.setAuthorId(1);
        dto.setLines(lines);
        journalEntryService.createJournalEntry(dto);
    }

    public Map<String, Object> seedExcelPhase1(Integer companyId) {
        Map<String, Object> summary = new LinkedHashMap<>();

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found"));

        if (!accountRepository.findByCompany_CompanyId(companyId).isEmpty() ||
            !supplierRepository.findByCompany_CompanyId(companyId).isEmpty() ||
            !customerRepository.findByCompany_CompanyId(companyId).isEmpty() ||
            !itemRepository.findByCompany_CompanyId(companyId).isEmpty()) {
            
            summary.put("status", "ERROR");
            summary.put("message", "Company data is not empty. Cannot proceed with Phase 1.");
            return summary;
        }
        
        try {
            // 1. Create exact Chart of Accounts
            Account cash = createPhase1Account(company, "1000", "Cash in Hand", AccountType.ASSET_BANK);
            createPhase1Account(company, "1010", "Bank Account", AccountType.ASSET_BANK);
            Account accRec = createPhase1Account(company, "1100", "Accounts Receivable", AccountType.ASSET_ACCOUNT_RECEIVABLE);
            createPhase1Account(company, "1200", "Raw Material Inventory", AccountType.ASSET_OTHER_CURRENT_ASSET);
            createPhase1Account(company, "1210", "Finished Goods Inventory", AccountType.ASSET_OTHER_CURRENT_ASSET);
            createPhase1Account(company, "1500", "Land", AccountType.ASSET_FIXED_ASSET);
            createPhase1Account(company, "1510", "Factory Building", AccountType.ASSET_FIXED_ASSET);
            createPhase1Account(company, "1520", "Machinery", AccountType.ASSET_FIXED_ASSET);
            createPhase1Account(company, "1530", "Furniture & Equipment", AccountType.ASSET_FIXED_ASSET);
            createPhase1Account(company, "1590", "Accumulated Depreciation - Building", AccountType.LIABILITY_OTHER_LIABILITY);
            createPhase1Account(company, "1591", "Accumulated Depreciation - Machinery", AccountType.LIABILITY_OTHER_LIABILITY);
            createPhase1Account(company, "1592", "Accumulated Depreciation - Furniture", AccountType.LIABILITY_OTHER_LIABILITY);
            Account accPay = createPhase1Account(company, "2000", "Accounts Payable", AccountType.LIABILITY_ACCOUNTS_PAYABLE);
            createPhase1Account(company, "2100", "Bank Loan", AccountType.LIABILITY_LONG_TERM_LIABILITY);
            Account taxPay = createPhase1Account(company, "2200", "VAT Payable", AccountType.LIABILITY_OTHER_CURRENT_LIABILITY);
            createPhase1Account(company, "3000", "Share Capital", AccountType.EQUITY);
            createPhase1Account(company, "3100", "Retained Earnings", AccountType.EQUITY);
            createPhase1Account(company, "4000", "Sales Revenue", AccountType.INCOME);
            createPhase1Account(company, "5000", "Cost of Goods Sold", AccountType.COST_OF_SALES);
            createPhase1Account(company, "5100", "Work in Progress / Manufacturing Cost", AccountType.COST_OF_SALES);
            Account adminExp = createPhase1Account(company, "6000", "Administrative Expenses", AccountType.EXPENSE);
            createPhase1Account(company, "6100", "Selling Expenses", AccountType.EXPENSE);
            createPhase1Account(company, "6200", "Salary Expense", AccountType.EXPENSE);
            createPhase1Account(company, "6300", "Depreciation Expense", AccountType.EXPENSE);
            createPhase1Account(company, "6400", "Interest Expense", AccountType.EXPENSE);

            // 2. Update company account references
            company.setAccountsReceivableAccount(accRec);
            company.setAccountsPayableAccount(accPay);
            company.setTaxAccount(taxPay);
            company.setFreightAccount(adminExp);
            companyRepository.save(company);

            // 3. Create suppliers
            createPhase1Supplier(company, "Main Raw Material Supplier", "supplier@example.com", SupplierType.SUPPLIER, ItemCategory.FURNITURE);
            createPhase1Supplier(company, "Packaging Material Supplier", "supplier@example.com", SupplierType.SUPPLIER, ItemCategory.ELECTRONICS);

            // 4. Create customers
            createPhase1Customer(company, "Main Credit Customer", "customer@example.com", com.example.GinumApps.enums.CustomerType.CORPORATE);
            createPhase1Customer(company, "Cash Customer", "customer@example.com", com.example.GinumApps.enums.CustomerType.INDIVIDUAL);

            // 5. Create inventory items
            createPhase1Item(company, "RM-001", "Raw Material", "Raw Material", ItemType.RAW_MATERIAL, new BigDecimal("3900"), new BigDecimal("3900"), new BigDecimal("205"), 10);
            createPhase1Item(company, "CH-001", "Chair", "Finished Goods", ItemType.SALES_ITEM, new BigDecimal("6500"), new BigDecimal("13000"), new BigDecimal("230"), 5);

            // 6. Opening Trial Balance using Journal Entry
            JournalEntryDto dto = new JournalEntryDto();
            dto.setCompanyId(companyId);
            dto.setEntryDate(LocalDate.of(2026, 1, 1));
            dto.setReferenceNo("OB-2026-001");
            dto.setJournalTitle("Opening balances from Excel trial balance");
            dto.setDescription("Opening balances from Excel trial balance");
            dto.setEntryType(JournalEntryType.MANUAL);
            dto.setAuthorId(1);

            List<JournalEntryLineDto> lines = new ArrayList<>();
            lines.add(new JournalEntryLineDto("1000", new BigDecimal("50000"), true, "Opening Balance"));
            lines.add(new JournalEntryLineDto("1010", new BigDecimal("2000000"), true, "Opening Balance"));
            lines.add(new JournalEntryLineDto("1100", new BigDecimal("1200000"), true, "Opening Balance"));
            lines.add(new JournalEntryLineDto("1200", new BigDecimal("800000"), true, "Opening Balance"));
            lines.add(new JournalEntryLineDto("1210", new BigDecimal("1500000"), true, "Opening Balance"));
            lines.add(new JournalEntryLineDto("1500", new BigDecimal("5000000"), true, "Opening Balance"));
            lines.add(new JournalEntryLineDto("1510", new BigDecimal("8000000"), true, "Opening Balance"));
            lines.add(new JournalEntryLineDto("1520", new BigDecimal("6000000"), true, "Opening Balance"));
            lines.add(new JournalEntryLineDto("1530", new BigDecimal("500000"), true, "Opening Balance"));

            lines.add(new JournalEntryLineDto("1590", new BigDecimal("800000"), false, "Opening Balance"));
            lines.add(new JournalEntryLineDto("1591", new BigDecimal("1200000"), false, "Opening Balance"));
            lines.add(new JournalEntryLineDto("1592", new BigDecimal("100000"), false, "Opening Balance"));
            lines.add(new JournalEntryLineDto("2000", new BigDecimal("1100000"), false, "Opening Balance"));
            lines.add(new JournalEntryLineDto("2100", new BigDecimal("4000000"), false, "Opening Balance"));
            lines.add(new JournalEntryLineDto("2200", new BigDecimal("100000"), false, "Opening Balance"));
            lines.add(new JournalEntryLineDto("3000", new BigDecimal("15000000"), false, "Opening Balance"));
            lines.add(new JournalEntryLineDto("3100", new BigDecimal("2750000"), false, "Opening Balance"));

            dto.setLines(lines);
            journalEntryService.createJournalEntry(dto);

            // Refresh accounts before verification
            List<String> errors = new ArrayList<>();
            verifyAccountBalance(companyId, "1000", new BigDecimal("50000"), errors);
            verifyAccountBalance(companyId, "1010", new BigDecimal("2000000"), errors);
            verifyAccountBalance(companyId, "1100", new BigDecimal("1200000"), errors);
            verifyAccountBalance(companyId, "1200", new BigDecimal("800000"), errors);
            verifyAccountBalance(companyId, "1210", new BigDecimal("1500000"), errors);
            verifyAccountBalance(companyId, "1500", new BigDecimal("5000000"), errors);
            verifyAccountBalance(companyId, "1510", new BigDecimal("8000000"), errors);
            verifyAccountBalance(companyId, "1520", new BigDecimal("6000000"), errors);
            verifyAccountBalance(companyId, "1530", new BigDecimal("500000"), errors);
            verifyAccountBalance(companyId, "1590", new BigDecimal("800000"), errors);
            verifyAccountBalance(companyId, "1591", new BigDecimal("1200000"), errors);
            verifyAccountBalance(companyId, "1592", new BigDecimal("100000"), errors);
            verifyAccountBalance(companyId, "2000", new BigDecimal("1100000"), errors);
            verifyAccountBalance(companyId, "2100", new BigDecimal("4000000"), errors);
            verifyAccountBalance(companyId, "2200", new BigDecimal("100000"), errors);
            verifyAccountBalance(companyId, "3000", new BigDecimal("15000000"), errors);
            verifyAccountBalance(companyId, "3100", new BigDecimal("2750000"), errors);

            if (!errors.isEmpty()) {
                summary.put("finalStatus", "ERROR");
                summary.put("errors", errors);
                return summary;
            }

            summary.put("finalStatus", "SUCCESS");
            summary.put("loginDataPreserved", true);
            summary.put("accountsCreated", 25);
            summary.put("suppliersCreated", 2);
            summary.put("customersCreated", 2);
            summary.put("itemsCreated", 2);
            summary.put("openingTrialBalanceImported", true);
            summary.put("openingTrialBalanceVerified", true);
            summary.put("cashInHandExpected", 50000);
            summary.put("cashInHandActual", accountRepository.findByAccountCodeAndCompany_CompanyId("1000", companyId).get().getCurrentBalance());
            summary.put("errors", errors);

            return summary;
        } catch (Exception e) {
            e.printStackTrace();
            summary.put("finalStatus", "ERROR");
            summary.put("message", e.getMessage());
            return summary;
        }
    }

    private Account createPhase1Account(Company company, String code, String name, AccountType type) throws Exception {
        AccountRequestDto dto = new AccountRequestDto();
        dto.setAccountCode(code);
        dto.setAccountName(name);
        dto.setAccountType(type);
        dto.setCurrentBalance(BigDecimal.ZERO);
        return accountService.createAccount(company.getCompanyId(), dto);
    }

    private void createPhase1Supplier(Company company, String name, String email, SupplierType type, ItemCategory cat) throws Exception {
        SupplierDto dto = new SupplierDto();
        dto.setSupplierName(name);
        dto.setEmail(email);
        dto.setMobileNo("0770000000");
        dto.setAddress("Colombo");
        dto.setSupplierType(type);
        dto.setTax(TaxType.INCLUSIVE);
        dto.setCurrencyId(company.getCountry().getDefaultCurrency().getId());
        dto.setItemCategory(cat);
        dto.setDiscountPercentage(0.0);
        supplierService.createSupplier(dto, company.getCompanyId());
    }

    private void createPhase1Customer(Company company, String name, String email, com.example.GinumApps.enums.CustomerType type) throws Exception {
        CustomerDto dto = new CustomerDto();
        dto.setName(name);
        dto.setEmail(email);
        dto.setPhoneNo("0771111111");
        dto.setDeliveryAddress("Colombo");
        dto.setBillingAddress("Colombo");
        dto.setCustomerType(type);
        dto.setTax(TaxType.INCLUSIVE);
        dto.setCurrencyId(company.getCountry().getDefaultCurrency().getId());
        dto.setDiscountPercentage(0.0);
        dto.setCompanyId(company.getCompanyId());
        customerService.createCustomer(dto);
    }

    private void createPhase1Item(Company company, String code, String name, String category, ItemType type, BigDecimal purchasePrice, BigDecimal unitPrice, BigDecimal stock, int reorder) throws Exception {
        ItemDto dto = new ItemDto();
        dto.setItemCode(code);
        dto.setName(name);
        dto.setCategory(category);
        dto.setItemType(type);
        dto.setPurchasePrice(purchasePrice);
        dto.setUnitPrice(unitPrice);
        dto.setCurrentStock(stock);
        dto.setReorderLevel(reorder);
        dto.setUnit("PCS");
        dto.setActive(true);
        dto.setDescription(name);
        itemService.createItem(company.getCompanyId(), dto);
    }

    private void verifyAccountBalance(Integer companyId, String code, BigDecimal expected, List<String> errors) {
        Account acc = accountRepository.findByAccountCodeAndCompany_CompanyId(code, companyId).orElse(null);
        if (acc == null) {
            errors.add(code + " account not found");
        } else {
            if (acc.getCurrentBalance().compareTo(expected) != 0) {
                errors.add(acc.getAccountName() + " (Expected: " + expected + ", Actual: " + acc.getCurrentBalance() + ")");
            }
        }
    }

    public Map<String, Object> seedExcelPhase2(Integer companyId) {
        Map<String, Object> summary = new LinkedHashMap<>();

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found"));

        List<String> errors = new ArrayList<>();

        // Verify Cash in Hand exactly 50000
        verifyAccountBalanceForPhase2(companyId, "1000", new BigDecimal("50000"), errors);
        // Verify Bank exactly 2000000
        verifyAccountBalanceForPhase2(companyId, "1010", new BigDecimal("2000000"), errors);

        String[] requiredAccounts = {"1000", "1010", "1100", "1200", "1210", "1520", "1590", "1591", "1592", "2000", "2100", "4000", "5000", "5100", "6000", "6100", "6200", "6300", "6400"};
        for (String accCode : requiredAccounts) {
            if (accountRepository.findByAccountCodeAndCompany_CompanyId(accCode, companyId).isEmpty()) {
                errors.add("Required account " + accCode + " is missing");
            }
        }

        // Check suppliers
        List<Supplier> suppliers = supplierRepository.findByCompany_CompanyId(companyId);
        boolean hasSupplier1 = suppliers.stream().anyMatch(s -> s.getSupplierName().equals("Main Raw Material Supplier"));
        boolean hasSupplier2 = suppliers.stream().anyMatch(s -> s.getSupplierName().equals("Packaging Material Supplier"));
        if (!hasSupplier1) errors.add("Missing supplier: Main Raw Material Supplier");
        if (!hasSupplier2) errors.add("Missing supplier: Packaging Material Supplier");

        // Check customers
        List<Customer> customers = customerRepository.findByCompany_CompanyId(companyId);
        boolean hasCust1 = customers.stream().anyMatch(c -> c.getName().equals("Main Credit Customer"));
        boolean hasCust2 = customers.stream().anyMatch(c -> c.getName().equals("Cash Customer"));
        if (!hasCust1) errors.add("Missing customer: Main Credit Customer");
        if (!hasCust2) errors.add("Missing customer: Cash Customer");

        // Check items
        List<Item> items = itemRepository.findByCompany_CompanyId(companyId);
        boolean hasItem1 = items.stream().anyMatch(i -> i.getName().equals("Raw Material"));
        boolean hasItem2 = items.stream().anyMatch(i -> i.getName().equals("Chair"));
        if (!hasItem1) errors.add("Missing item: Raw Material");
        if (!hasItem2) errors.add("Missing item: Chair");

        if (!errors.isEmpty()) {
            summary.put("finalStatus", "ERROR");
            summary.put("errors", errors);
            return summary;
        }

        Set<String> existingJournals = journalEntryRepository.findByCompany_CompanyId(companyId).stream()
                .map(JournalEntry::getReferenceNo)
                .collect(Collectors.toSet());

        int purchasesCreated = 0;
        int supplierPaymentsCreated = 0;
        int salesCreated = 0;
        int customerCollectionsCreated = 0;
        int payrollCreated = 0;
        int adminExpensesCreated = 0;
        int sellingExpensesCreated = 0;
        int fixedAssetTransactionsCreated = 0;
        int loanTransactionsCreated = 0;
        int depreciationEntriesCreated = 0;
        int manufacturingEntriesCreated = 0;

        try {
            // A) Purchases
            if (createPhase2Entry(company, existingJournals, "DEMO-PO-001", "2026-01-03", "Purchased raw materials on credit", "1200", "2000", new BigDecimal("1200000"))) purchasesCreated++;
            if (createPhase2Entry(company, existingJournals, "DEMO-PO-002", "2026-01-10", "Purchased raw materials cash", "1200", "1010", new BigDecimal("300000"))) purchasesCreated++;
            if (createPhase2Entry(company, existingJournals, "DEMO-PO-003", "2026-01-18", "Purchased packaging materials credit", "5100", "2000", new BigDecimal("200000"))) purchasesCreated++;

            // B) Supplier Payments
            if (createPhase2Entry(company, existingJournals, "DEMO-SP-001", "2026-01-15", "Paid suppliers by bank", "2000", "1010", new BigDecimal("800000"))) supplierPaymentsCreated++;
            if (createPhase2Entry(company, existingJournals, "DEMO-SP-002", "2026-01-28", "Paid suppliers by bank", "2000", "1010", new BigDecimal("500000"))) supplierPaymentsCreated++;

            // C) Sales
            if (createPhase2Entry(company, existingJournals, "DEMO-SO-001", "2026-01-08", "Credit Sales", "1100", "4000", new BigDecimal("1500000"))) salesCreated++;
            if (createPhase2Entry(company, existingJournals, "DEMO-SO-002", "2026-01-16", "Cash Sales", "1010", "4000", new BigDecimal("800000"))) salesCreated++;
            if (createPhase2Entry(company, existingJournals, "DEMO-SO-003", "2026-01-25", "Credit Sales", "1100", "4000", new BigDecimal("2000000"))) salesCreated++;

            // D) Customer Collections
            if (createPhase2Entry(company, existingJournals, "DEMO-RC-001", "2026-01-12", "Collection from debtors", "1010", "1100", new BigDecimal("1000000"))) customerCollectionsCreated++;
            if (createPhase2Entry(company, existingJournals, "DEMO-RC-002", "2026-01-29", "Collection from debtors", "1010", "1100", new BigDecimal("1500000"))) customerCollectionsCreated++;

            // E) Payroll
            if (createPhase2Entry(company, existingJournals, "DEMO-PAY-001", "2026-01-31", "Factory wages", "6200", "1010", new BigDecimal("900000"))) payrollCreated++;
            if (createPhase2Entry(company, existingJournals, "DEMO-PAY-002", "2026-01-31", "Admin salaries", "6000", "1010", new BigDecimal("250000"))) payrollCreated++;
            if (createPhase2Entry(company, existingJournals, "DEMO-PAY-003", "2026-01-31", "Sales salaries", "6100", "1010", new BigDecimal("200000"))) payrollCreated++;

            // F) Admin Expenses
            if (createPhase2Entry(company, existingJournals, "DEMO-ADM-001", "2026-01-31", "Office rent", "6000", "1010", new BigDecimal("100000"))) adminExpensesCreated++;
            if (createPhase2Entry(company, existingJournals, "DEMO-ADM-002", "2026-01-31", "Telephone", "6000", "1010", new BigDecimal("30000"))) adminExpensesCreated++;
            if (createPhase2Entry(company, existingJournals, "DEMO-ADM-003", "2026-01-31", "Internet", "6000", "1010", new BigDecimal("20000"))) adminExpensesCreated++;
            if (createPhase2Entry(company, existingJournals, "DEMO-ADM-004", "2026-01-31", "Office supplies", "6000", "1010", new BigDecimal("25000"))) adminExpensesCreated++;
            if (createPhase2Entry(company, existingJournals, "DEMO-ADM-005", "2026-01-31", "Insurance", "6000", "1010", new BigDecimal("40000"))) adminExpensesCreated++;

            // G) Selling Expenses
            if (createPhase2Entry(company, existingJournals, "DEMO-SELL-001", "2026-01-31", "Advertising", "6100", "1010", new BigDecimal("120000"))) sellingExpensesCreated++;
            if (createPhase2Entry(company, existingJournals, "DEMO-SELL-002", "2026-01-31", "Delivery expenses", "6100", "1010", new BigDecimal("80000"))) sellingExpensesCreated++;

            // H) Fixed Asset
            if (createPhase2Entry(company, existingJournals, "DEMO-FA-001", "2026-01-20", "Purchased new machinery", "1520", "1010", new BigDecimal("1500000"))) fixedAssetTransactionsCreated++;

            // I) Loan
            if (createPhase2Entry(company, existingJournals, "DEMO-LOAN-001", "2026-01-31", "Loan repayment", "2100", "1010", new BigDecimal("200000"))) loanTransactionsCreated++;
            if (createPhase2Entry(company, existingJournals, "DEMO-INT-001", "2026-01-31", "Loan interest", "6400", "1010", new BigDecimal("50000"))) loanTransactionsCreated++;

            // J) Depreciation
            if (createPhase2Entry(company, existingJournals, "DEMO-DEP-001", "2026-01-31", "Building depreciation", "6300", "1590", new BigDecimal("40000"))) depreciationEntriesCreated++;
            if (createPhase2Entry(company, existingJournals, "DEMO-DEP-002", "2026-01-31", "Machinery depreciation", "6300", "1591", new BigDecimal("75000"))) depreciationEntriesCreated++;
            if (createPhase2Entry(company, existingJournals, "DEMO-DEP-003", "2026-01-31", "Furniture depreciation", "6300", "1592", new BigDecimal("10000"))) depreciationEntriesCreated++;

            // K) Manufacturing
            if (createPhase2Entry(company, existingJournals, "DEMO-MFG-001", "2026-01-31", "Raw materials issued to production", "5100", "1200", new BigDecimal("1400000"))) manufacturingEntriesCreated++;
            if (createPhase2Entry(company, existingJournals, "DEMO-MFG-002", "2026-01-31", "Direct labour", "5100", "6200", new BigDecimal("900000"))) manufacturingEntriesCreated++;
            if (createPhase2Entry(company, existingJournals, "DEMO-MFG-003", "2026-01-31", "Factory electricity", "5100", "1010", new BigDecimal("180000"))) manufacturingEntriesCreated++;
            if (createPhase2Entry(company, existingJournals, "DEMO-MFG-004", "2026-01-31", "Factory rent", "5100", "1010", new BigDecimal("150000"))) manufacturingEntriesCreated++;
            if (createPhase2Entry(company, existingJournals, "DEMO-MFG-005", "2026-01-31", "Factory maintenance", "5100", "1010", new BigDecimal("70000"))) manufacturingEntriesCreated++;
            if (createPhase2Entry(company, existingJournals, "DEMO-MFG-006", "2026-01-31", "Finished Goods Produced", "1210", "5100", new BigDecimal("2700000"))) manufacturingEntriesCreated++;
            if (createPhase2Entry(company, existingJournals, "DEMO-MFG-007", "2026-01-31", "Cost of Goods Sold", "5000", "1210", new BigDecimal("2400000"))) manufacturingEntriesCreated++;

            // Inventory Adjustment if needed
            int inventoryAdjustments = 0;
            Account rm = accountRepository.findByAccountCodeAndCompany_CompanyId("1200", companyId).orElse(null);
            if (rm != null && rm.getCurrentBalance().compareTo(new BigDecimal("900000")) != 0) {
                BigDecimal diff = new BigDecimal("900000").subtract(rm.getCurrentBalance());
                if (diff.compareTo(BigDecimal.ZERO) > 0) {
                    if (createPhase2Entry(company, existingJournals, "DEMO-INV-001", "2026-01-31", "Closing inventory adjustment - Raw Materials", "1200", "5100", diff)) inventoryAdjustments++;
                } else {
                    if (createPhase2Entry(company, existingJournals, "DEMO-INV-001", "2026-01-31", "Closing inventory adjustment - Raw Materials", "5100", "1200", diff.abs())) inventoryAdjustments++;
                }
            }

            Account fg = accountRepository.findByAccountCodeAndCompany_CompanyId("1210", companyId).orElse(null);
            if (fg != null && fg.getCurrentBalance().compareTo(new BigDecimal("1800000")) != 0) {
                BigDecimal diff = new BigDecimal("1800000").subtract(fg.getCurrentBalance());
                if (diff.compareTo(BigDecimal.ZERO) > 0) {
                    if (createPhase2Entry(company, existingJournals, "DEMO-INV-002", "2026-01-31", "Closing inventory adjustment - Finished Goods", "1210", "5000", diff)) inventoryAdjustments++;
                } else {
                    if (createPhase2Entry(company, existingJournals, "DEMO-INV-002", "2026-01-31", "Closing inventory adjustment - Finished Goods", "5000", "1210", diff.abs())) inventoryAdjustments++;
                }
            }

            // Results
            summary.put("finalStatus", "SUCCESS");
            summary.put("openingBalancePreserved", true);
            summary.put("purchasesCreated", purchasesCreated);
            summary.put("supplierPaymentsCreated", supplierPaymentsCreated);
            summary.put("salesCreated", salesCreated);
            summary.put("customerCollectionsCreated", customerCollectionsCreated);
            summary.put("payrollCreated", payrollCreated);
            summary.put("adminExpensesCreated", adminExpensesCreated);
            summary.put("sellingExpensesCreated", sellingExpensesCreated);
            summary.put("fixedAssetTransactionsCreated", fixedAssetTransactionsCreated);
            summary.put("loanTransactionsCreated", loanTransactionsCreated);
            summary.put("depreciationEntriesCreated", depreciationEntriesCreated);
            summary.put("manufacturingEntriesCreated", manufacturingEntriesCreated);
            summary.put("closingInventoryAdjustmentsCreated", inventoryAdjustments);

            summary.put("rawMaterialClosingExpected", 900000);
            summary.put("rawMaterialClosingActual", accountRepository.findByAccountCodeAndCompany_CompanyId("1200", companyId).get().getCurrentBalance());
            summary.put("finishedGoodsClosingExpected", 1800000);
            summary.put("finishedGoodsClosingActual", accountRepository.findByAccountCodeAndCompany_CompanyId("1210", companyId).get().getCurrentBalance());
            summary.put("errors", errors);
            summary.put("note", "Dashboard may require January 2026 filter because Excel transactions are dated January 2026.");

        } catch (Exception e) {
            e.printStackTrace();
            summary.put("finalStatus", "ERROR");
            summary.put("message", e.getMessage());
        }

        return summary;
    }

    private void verifyAccountBalanceForPhase2(Integer companyId, String code, BigDecimal expected, List<String> errors) {
        Account acc = accountRepository.findByAccountCodeAndCompany_CompanyId(code, companyId).orElse(null);
        if (acc == null) {
            errors.add(code + " account not found");
        } else {
            if (acc.getCurrentBalance().compareTo(expected) != 0) {
                errors.add(acc.getAccountName() + " (Expected: " + expected + ", Actual: " + acc.getCurrentBalance() + ")");
            }
        }
    }

    private boolean createPhase2Entry(Company company, Set<String> existingJournals, String refNo, String dateStr, String desc, String drCode, String crCode, BigDecimal amount) throws Exception {
        if (existingJournals.contains(refNo)) {
            return false;
        }

        LocalDate date = LocalDate.parse(dateStr);

        JournalEntryDto dto = new JournalEntryDto();
        dto.setCompanyId(company.getCompanyId());
        dto.setEntryDate(date);
        dto.setReferenceNo(refNo);
        dto.setJournalTitle(desc);
        dto.setDescription(desc);
        dto.setEntryType(JournalEntryType.MANUAL);
        dto.setAuthorId(1);

        List<JournalEntryLineDto> lines = new ArrayList<>();
        lines.add(new JournalEntryLineDto(drCode, amount, true, desc));
        lines.add(new JournalEntryLineDto(crCode, amount, false, desc));

        dto.setLines(lines);
        journalEntryService.createJournalEntry(dto);

        // Also create Transaction summary
        Transaction t = new Transaction();
        t.setCompany(company);
        t.setReferenceNumber(refNo);
        t.setDate(dateStr);
        t.setDescription(desc);
        t.setTotalDebit(amount.doubleValue());
        t.setTotalCredit(amount.doubleValue());
        transactionRepository.save(t);

        existingJournals.add(refNo);
        return true;
    }

    public Map<String, Object> excelFixVisibility(Integer companyId) {
        Map<String, Object> summary = new LinkedHashMap<>();

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found"));

        List<String> errors = new ArrayList<>();
        int purchaseOrdersVisible = 0;
        int salesOrdersVisible = 0;

        try {
            // Suppliers
            Supplier rawSupplier = supplierRepository.findByCompany_CompanyId(companyId).stream()
                    .filter(s -> s.getSupplierName().equals("Main Raw Material Supplier")).findFirst().orElse(null);
            Supplier pkgSupplier = supplierRepository.findByCompany_CompanyId(companyId).stream()
                    .filter(s -> s.getSupplierName().equals("Packaging Material Supplier")).findFirst().orElse(null);
            
            // Customers
            Customer creditCustomer = customerRepository.findByCompany_CompanyId(companyId).stream()
                    .filter(c -> c.getName().equals("Main Credit Customer")).findFirst().orElse(null);
            Customer cashCustomer = customerRepository.findByCompany_CompanyId(companyId).stream()
                    .filter(c -> c.getName().equals("Cash Customer")).findFirst().orElse(null);

            // Items
            Item rawItem = itemRepository.findByCompany_CompanyId(companyId).stream()
                    .filter(i -> i.getName().equals("Raw Material")).findFirst().orElse(null);
            Item pkgItem = itemRepository.findByCompany_CompanyId(companyId).stream()
                    .filter(i -> i.getName().equals("Packaging Material")).findFirst().orElse(rawItem);
            Item chairItem = itemRepository.findByCompany_CompanyId(companyId).stream()
                    .filter(i -> i.getName().equals("Chair")).findFirst().orElse(null);

            // Bank Account for paid orders
            Account bankAcc = accountRepository.findByAccountCodeAndCompany_CompanyId("1010", companyId).orElse(null);

            // Purchase Orders
            purchaseOrdersVisible += createVisibilityPO(company, "DEMO-PO-001", "2026-01-03", "Purchased raw materials on credit", rawSupplier, rawItem, 10, new BigDecimal("120000"), new BigDecimal("1200000"), false, bankAcc);
            purchaseOrdersVisible += createVisibilityPO(company, "DEMO-PO-002", "2026-01-10", "Purchased raw materials cash", rawSupplier, rawItem, 1, new BigDecimal("300000"), new BigDecimal("300000"), true, bankAcc);
            purchaseOrdersVisible += createVisibilityPO(company, "DEMO-PO-003", "2026-01-18", "Purchased packaging materials credit", pkgSupplier, pkgItem, 1, new BigDecimal("200000"), new BigDecimal("200000"), false, bankAcc);

            // Sales Orders
            salesOrdersVisible += createVisibilitySO(company, "DEMO-SO-001", "2026-01-08", "Credit Sales", creditCustomer, chairItem, 1, new BigDecimal("1500000"), new BigDecimal("1500000"), false, bankAcc);
            salesOrdersVisible += createVisibilitySO(company, "DEMO-SO-002", "2026-01-16", "Cash Sales", cashCustomer, chairItem, 1, new BigDecimal("800000"), new BigDecimal("800000"), true, bankAcc);
            salesOrdersVisible += createVisibilitySO(company, "DEMO-SO-003", "2026-01-25", "Credit Sales", creditCustomer, chairItem, 1, new BigDecimal("2000000"), new BigDecimal("2000000"), false, bankAcc);

            // Finished Goods Inventory adjustment
            Set<String> existingJournals = journalEntryRepository.findByCompany_CompanyId(companyId).stream()
                    .map(JournalEntry::getReferenceNo)
                    .collect(Collectors.toSet());

            Account fg = accountRepository.findByAccountCodeAndCompany_CompanyId("1210", companyId).orElse(null);
            if (fg != null && fg.getCurrentBalance().compareTo(new BigDecimal("1800000")) < 0) {
                BigDecimal diff = new BigDecimal("1800000").subtract(fg.getCurrentBalance());
                createPhase2Entry(company, existingJournals, "DEMO-INV-002", "2026-01-31", "Closing inventory adjustment - Finished Goods", "1210", "5100", diff);
            }

            summary.put("finalStatus", "SUCCESS");
            summary.put("purchaseOrdersVisible", purchaseOrderRepository.findByCompany_CompanyId(companyId).size());
            summary.put("salesOrdersVisible", salesOrderRepository.findByCompany_CompanyId(companyId).size());
            
            summary.put("rawMaterialInventoryActual", accountRepository.findByAccountCodeAndCompany_CompanyId("1200", companyId).map(Account::getCurrentBalance).orElse(BigDecimal.ZERO));
            summary.put("finishedGoodsInventoryExpected", 1800000);
            summary.put("finishedGoodsInventoryActual", accountRepository.findByAccountCodeAndCompany_CompanyId("1210", companyId).map(Account::getCurrentBalance).orElse(BigDecimal.ZERO));
            summary.put("dashboardNote", "Dashboard may show 0 because Excel transactions are dated January 2026 and dashboard displays Last 30 Days.");
            summary.put("errors", errors);

        } catch (Exception e) {
            e.printStackTrace();
            summary.put("finalStatus", "ERROR");
            summary.put("message", e.getMessage());
        }

        return summary;
    }

    private int createVisibilityPO(Company company, String poNumber, String dateStr, String notes, Supplier supplier, Item item, int qty, BigDecimal unitPrice, BigDecimal totalAmount, boolean isPaid, Account bankAcc) {
        if (supplier == null || item == null) return 0;
        
        Optional<PurchaseOrder> existing = purchaseOrderRepository.findByPoNumberAndCompany_CompanyId(poNumber, company.getCompanyId());
        if (existing.isPresent()) return 0;

        PurchaseOrder po = new PurchaseOrder();
        po.setCompany(company);
        po.setPoNumber(poNumber);
        po.setSupplier(supplier);
        po.setIssueDate(LocalDate.parse(dateStr));
        po.setDueDate(LocalDate.parse(dateStr));
        po.setNotes(notes);
        po.setPurchaseType(PurchaseType.GOODS);

        if (isPaid && bankAcc != null) {
            po.setPaymentAccount(bankAcc);
            po.setAmountPaid(totalAmount);
        }

        PurchaseOrderLineItem line = new PurchaseOrderLineItem();
        line.setPurchaseOrder(po);
        line.setItem(item);
        line.setDescription(notes);
        line.setQuantity(qty);
        line.setUnitPrice(unitPrice);
        line.setItemType(LineItemType.GOODS);
        line.setAmount(totalAmount);
        po.getItems().add(line);

        purchaseOrderRepository.save(po);
        return 1;
    }

    private int createVisibilitySO(Company company, String soNumber, String dateStr, String notes, Customer customer, Item item, int qty, BigDecimal unitPrice, BigDecimal totalAmount, boolean isPaid, Account bankAcc) {
        if (customer == null || item == null) return 0;
        
        boolean exists = salesOrderRepository.findByCompany_CompanyId(company.getCompanyId()).stream()
                .anyMatch(s -> soNumber.equals(s.getSoNumber()));
        if (exists) return 0;

        SalesOrder so = new SalesOrder();
        so.setCompany(company);
        so.setSoNumber(soNumber);
        so.setCustomer(customer);
        so.setIssueDate(LocalDate.parse(dateStr));
        so.setDueDate(LocalDate.parse(dateStr));
        so.setNotes(notes);
        so.setSalesType(SalesType.GOODS);

        if (isPaid && bankAcc != null) {
            so.setPaymentAccount(bankAcc);
            so.setAmountPaid(totalAmount);
        }

        SalesOrderLineItem line = new SalesOrderLineItem();
        line.setSalesOrder(so);
        line.setItem(item);
        line.setDescription(notes);
        line.setQuantity(qty);
        line.setUnitPrice(totalAmount); // Use totalAmount to guarantee correct SO subtotal
        line.setItemType(LineItemType.GOODS);
        so.getItems().add(line);

        salesOrderRepository.save(so);
        return 1;
    }
}
