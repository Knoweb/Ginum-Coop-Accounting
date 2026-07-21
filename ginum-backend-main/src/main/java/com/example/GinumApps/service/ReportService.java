package com.example.GinumApps.service;

import com.example.GinumApps.dto.BalanceSheetResponseDto;
import com.example.GinumApps.dto.BalanceSheetResponseDto.BalanceSheetLineDto;
import com.example.GinumApps.dto.IncomeStatementResponseDto;
import com.example.GinumApps.dto.IncomeStatementResponseDto.IncomeStatementLineDto;
import com.example.GinumApps.dto.TrialBalanceResponseDto;
import com.example.GinumApps.dto.TrialBalanceResponseDto.TrialBalanceLineDto;
import com.example.GinumApps.dto.CashFlowResponseDto;
import com.example.GinumApps.dto.CashFlowResponseDto.CashFlowLineDto;
import com.example.GinumApps.dto.GeneralLedgerResponseDto;
import com.example.GinumApps.enums.AccountType;
import com.example.GinumApps.model.Account;
import com.example.GinumApps.model.JournalEntry;
import com.example.GinumApps.model.JournalEntryLine;
import com.example.GinumApps.repository.AccountRepository;
import com.example.GinumApps.repository.JournalEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.HashSet;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final AccountRepository accountRepository;
    private final JournalEntryRepository journalEntryRepository;

    public BalanceSheetResponseDto getBalanceSheet(Integer companyId) {
        List<Account> accounts = accountRepository.findByCompany_CompanyId(companyId);

        List<BalanceSheetLineDto> currentAssets = new ArrayList<>();
        List<BalanceSheetLineDto> nonCurrentAssets = new ArrayList<>();
        List<BalanceSheetLineDto> currentLiabilities = new ArrayList<>();
        List<BalanceSheetLineDto> nonCurrentLiabilities = new ArrayList<>();
        List<BalanceSheetLineDto> equity = new ArrayList<>();

        BigDecimal totalCurrentAssets = BigDecimal.ZERO;
        BigDecimal totalNonCurrentAssets = BigDecimal.ZERO;
        BigDecimal totalCurrentLiabilities = BigDecimal.ZERO;
        BigDecimal totalNonCurrentLiabilities = BigDecimal.ZERO;
        BigDecimal totalEquityAccounts = BigDecimal.ZERO;

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpenses = BigDecimal.ZERO;

        for (Account account : accounts) {
            AccountType type = account.getAccountType();
            BigDecimal balance = account.getCurrentBalance() != null ? account.getCurrentBalance() : BigDecimal.ZERO;

            switch (type) {
                // Assets
                case ASSET_BANK:
                case ASSET_ACCOUNT_RECEIVABLE:
                case ASSET_OTHER_CURRENT_ASSET:
                    currentAssets.add(new BalanceSheetLineDto(account.getAccountName(), account.getAccountCode(), balance));
                    totalCurrentAssets = totalCurrentAssets.add(balance);
                    break;
                case ASSET_FIXED_ASSET:
                case ASSET_OTHER_ASSET:
                    nonCurrentAssets.add(new BalanceSheetLineDto(account.getAccountName(), account.getAccountCode(), balance));
                    totalNonCurrentAssets = totalNonCurrentAssets.add(balance);
                    break;

                // Liabilities
                case LIABILITY_CREDIT_CARD:
                case LIABILITY_ACCOUNTS_PAYABLE:
                case LIABILITY_OTHER_CURRENT_LIABILITY:
                    currentLiabilities.add(new BalanceSheetLineDto(account.getAccountName(), account.getAccountCode(), balance));
                    totalCurrentLiabilities = totalCurrentLiabilities.add(balance);
                    break;
                case LIABILITY_LONG_TERM_LIABILITY:
                case LIABILITY_OTHER_LIABILITY:
                    nonCurrentLiabilities.add(new BalanceSheetLineDto(account.getAccountName(), account.getAccountCode(), balance));
                    totalNonCurrentLiabilities = totalNonCurrentLiabilities.add(balance);
                    break;

                // Equity
                case EQUITY:
                    equity.add(new BalanceSheetLineDto(account.getAccountName(), account.getAccountCode(), balance));
                    totalEquityAccounts = totalEquityAccounts.add(balance);
                    break;

                // Income
                case INCOME:
                case OTHER_INCOME:
                    totalIncome = totalIncome.add(balance);
                    break;

                // Expenses
                case EXPENSE:
                case COST_OF_SALES:
                case OTHER_EXPENSE:
                    totalExpenses = totalExpenses.add(balance);
                    break;

                default:
                    // If any type is missed, fall back based on main category
                    String mainCat = type.getMainCategory();
                    if ("Asset".equalsIgnoreCase(mainCat)) {
                        currentAssets.add(new BalanceSheetLineDto(account.getAccountName(), account.getAccountCode(), balance));
                        totalCurrentAssets = totalCurrentAssets.add(balance);
                    } else if ("Liability".equalsIgnoreCase(mainCat)) {
                        currentLiabilities.add(new BalanceSheetLineDto(account.getAccountName(), account.getAccountCode(), balance));
                        totalCurrentLiabilities = totalCurrentLiabilities.add(balance);
                    } else if ("Equity".equalsIgnoreCase(mainCat)) {
                        equity.add(new BalanceSheetLineDto(account.getAccountName(), account.getAccountCode(), balance));
                        totalEquityAccounts = totalEquityAccounts.add(balance);
                    } else if ("Income".equalsIgnoreCase(mainCat)) {
                        totalIncome = totalIncome.add(balance);
                    } else if ("Expense".equalsIgnoreCase(mainCat) || "Cost of Sales".equalsIgnoreCase(mainCat)) {
                        totalExpenses = totalExpenses.add(balance);
                    }
                    break;
            }
        }

        // Net Profit/Loss = Revenue - Expenses
        BigDecimal netProfitLoss = totalIncome.subtract(totalExpenses);

        // Add Net Profit/Loss dynamically as a line in Equity
        equity.add(new BalanceSheetLineDto("Current Period Profit/Loss", "NET_INCOME", netProfitLoss));

        BigDecimal totalAssets = totalCurrentAssets.add(totalNonCurrentAssets);
        BigDecimal totalLiabilities = totalCurrentLiabilities.add(totalNonCurrentLiabilities);
        BigDecimal totalEquity = totalEquityAccounts.add(netProfitLoss);

        BigDecimal diff = totalAssets.subtract(totalLiabilities.add(totalEquity)).abs();
        boolean balanced = diff.compareTo(new BigDecimal("0.01")) < 0;

        BalanceSheetResponseDto response = new BalanceSheetResponseDto();
        response.setCurrentAssets(currentAssets);
        response.setNonCurrentAssets(nonCurrentAssets);
        response.setCurrentLiabilities(currentLiabilities);
        response.setNonCurrentLiabilities(nonCurrentLiabilities);
        response.setEquity(equity);
        response.setNetProfitLoss(netProfitLoss);
        response.setTotalAssets(totalAssets);
        response.setTotalLiabilities(totalLiabilities);
        response.setTotalEquity(totalEquity);
        response.setBalanced(balanced);

        return response;
    }

    public IncomeStatementResponseDto getIncomeStatement(
            Integer companyId,
            String startDateStr,
            String endDateStr,
            Integer year,
            Integer quarter,
            Integer month
    ) {
        // Resolve date range
        LocalDate startDate;
        LocalDate endDate;

        if (startDateStr != null && endDateStr != null) {
            startDate = LocalDate.parse(startDateStr);
            endDate = LocalDate.parse(endDateStr);
        } else if (year != null && quarter != null) {
            startDate = switch (quarter) {
                case 1 -> LocalDate.of(year, 1, 1);
                case 2 -> LocalDate.of(year, 4, 1);
                case 3 -> LocalDate.of(year, 7, 1);
                case 4 -> LocalDate.of(year, 10, 1);
                default -> LocalDate.of(year, 1, 1);
            };
            endDate = switch (quarter) {
                case 1 -> LocalDate.of(year, 3, 31);
                case 2 -> LocalDate.of(year, 6, 30);
                case 3 -> LocalDate.of(year, 9, 30);
                case 4 -> LocalDate.of(year, 12, 31);
                default -> LocalDate.of(year, 12, 31);
            };
        } else if (year != null && month != null) {
            startDate = LocalDate.of(year, month, 1);
            endDate = java.time.YearMonth.of(year, month).atEndOfMonth();
        } else if (year != null) {
            startDate = LocalDate.of(year, 1, 1);
            endDate = LocalDate.of(year, 12, 31);
        } else {
            // Default to current year
            LocalDate now = LocalDate.now();
            startDate = now.with(java.time.temporal.TemporalAdjusters.firstDayOfYear());
            endDate = now.with(java.time.temporal.TemporalAdjusters.lastDayOfYear());
        }

        // Fetch accounts
        List<Account> accounts = accountRepository.findByCompany_CompanyId(companyId);

        // Fetch journal entries in period
        List<JournalEntry> journalEntries = journalEntryRepository.findByCompany_CompanyIdAndEntryDateBetween(
                companyId, startDate, endDate
        );

        // Maps to hold computed balances for this period
        java.util.Map<Long, BigDecimal> periodBalances = new java.util.HashMap<>();
        boolean hasJournalEntries = !journalEntries.isEmpty();

        if (hasJournalEntries) {
            // Process lines
            for (JournalEntry entry : journalEntries) {
                for (JournalEntryLine line : entry.getJournalEntryLines()) {
                    Account acc = line.getAccount();
                    BigDecimal amount = line.getAmount();
                    boolean isDebit = line.isDebit();

                    BigDecimal balanceChange = calculateBalanceChange(acc.getAccountType(), isDebit, amount);
                    BigDecimal currentPeriodBal = periodBalances.getOrDefault(acc.getId(), BigDecimal.ZERO);
                    periodBalances.put(acc.getId(), currentPeriodBal.add(balanceChange));
                }
            }
        }

        // Categorized list DTOs
        List<IncomeStatementLineDto> revenue = new ArrayList<>();
        List<IncomeStatementLineDto> costOfGoodsSold = new ArrayList<>();
        List<IncomeStatementLineDto> operatingExpenses = new ArrayList<>();
        List<IncomeStatementLineDto> otherIncome = new ArrayList<>();
        List<IncomeStatementLineDto> otherExpenses = new ArrayList<>();

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalCostOfGoodsSold = BigDecimal.ZERO;
        BigDecimal totalOperatingExpenses = BigDecimal.ZERO;
        BigDecimal totalOtherIncome = BigDecimal.ZERO;
        BigDecimal totalOtherExpenses = BigDecimal.ZERO;

        for (Account account : accounts) {
            AccountType type = account.getAccountType();
            BigDecimal balance;
            if (hasJournalEntries) {
                balance = periodBalances.getOrDefault(account.getId(), BigDecimal.ZERO);
            } else {
                balance = account.getCurrentBalance() != null ? account.getCurrentBalance() : BigDecimal.ZERO;
            }

            switch (type) {
                case INCOME:
                    revenue.add(new IncomeStatementLineDto(account.getAccountName(), account.getAccountCode(), balance));
                    totalRevenue = totalRevenue.add(balance);
                    break;
                case COST_OF_SALES:
                    costOfGoodsSold.add(new IncomeStatementLineDto(account.getAccountName(), account.getAccountCode(), balance));
                    totalCostOfGoodsSold = totalCostOfGoodsSold.add(balance);
                    break;
                case EXPENSE:
                    operatingExpenses.add(new IncomeStatementLineDto(account.getAccountName(), account.getAccountCode(), balance));
                    totalOperatingExpenses = totalOperatingExpenses.add(balance);
                    break;
                case OTHER_INCOME:
                    otherIncome.add(new IncomeStatementLineDto(account.getAccountName(), account.getAccountCode(), balance));
                    totalOtherIncome = totalOtherIncome.add(balance);
                    break;
                case OTHER_EXPENSE:
                    otherExpenses.add(new IncomeStatementLineDto(account.getAccountName(), account.getAccountCode(), balance));
                    totalOtherExpenses = totalOtherExpenses.add(balance);
                    break;
                default:
                    String mainCat = type.getMainCategory();
                    if ("Income".equalsIgnoreCase(mainCat)) {
                        revenue.add(new IncomeStatementLineDto(account.getAccountName(), account.getAccountCode(), balance));
                        totalRevenue = totalRevenue.add(balance);
                    } else if ("Cost of Sales".equalsIgnoreCase(mainCat)) {
                        costOfGoodsSold.add(new IncomeStatementLineDto(account.getAccountName(), account.getAccountCode(), balance));
                        totalCostOfGoodsSold = totalCostOfGoodsSold.add(balance);
                    } else if ("Expense".equalsIgnoreCase(mainCat)) {
                        operatingExpenses.add(new IncomeStatementLineDto(account.getAccountName(), account.getAccountCode(), balance));
                        totalOperatingExpenses = totalOperatingExpenses.add(balance);
                    } else if ("Other Income".equalsIgnoreCase(mainCat)) {
                        otherIncome.add(new IncomeStatementLineDto(account.getAccountName(), account.getAccountCode(), balance));
                        totalOtherIncome = totalOtherIncome.add(balance);
                    } else if ("Other Expense".equalsIgnoreCase(mainCat)) {
                        otherExpenses.add(new IncomeStatementLineDto(account.getAccountName(), account.getAccountCode(), balance));
                        totalOtherExpenses = totalOtherExpenses.add(balance);
                    }
                    break;
            }
        }

        BigDecimal grossProfit = totalRevenue.subtract(totalCostOfGoodsSold);
        BigDecimal operatingProfit = grossProfit.subtract(totalOperatingExpenses);
        BigDecimal netProfitLoss = operatingProfit.add(totalOtherIncome).subtract(totalOtherExpenses);

        IncomeStatementResponseDto response = new IncomeStatementResponseDto();
        response.setRevenue(revenue);
        response.setCostOfGoodsSold(costOfGoodsSold);
        response.setOperatingExpenses(operatingExpenses);
        response.setOtherIncome(otherIncome);
        response.setOtherExpenses(otherExpenses);
        response.setTotalRevenue(totalRevenue);
        response.setTotalCostOfGoodsSold(totalCostOfGoodsSold);
        response.setGrossProfit(grossProfit);
        response.setTotalOperatingExpenses(totalOperatingExpenses);
        response.setOperatingProfit(operatingProfit);
        response.setTotalOtherIncome(totalOtherIncome);
        response.setTotalOtherExpenses(totalOtherExpenses);
        response.setNetProfitLoss(netProfitLoss);
        response.setStartDate(startDate);
        response.setEndDate(endDate);

        return response;
    }

    public TrialBalanceResponseDto getTrialBalance(
            Integer companyId,
            String startDateStr,
            String endDateStr,
            Integer year,
            Integer quarter,
            Integer month
    ) {
        // Resolve date range
        LocalDate startDate;
        LocalDate endDate;

        if (startDateStr != null && endDateStr != null) {
            startDate = LocalDate.parse(startDateStr);
            endDate = LocalDate.parse(endDateStr);
        } else if (year != null && quarter != null) {
            startDate = switch (quarter) {
                case 1 -> LocalDate.of(year, 1, 1);
                case 2 -> LocalDate.of(year, 4, 1);
                case 3 -> LocalDate.of(year, 7, 1);
                case 4 -> LocalDate.of(year, 10, 1);
                default -> LocalDate.of(year, 1, 1);
            };
            endDate = switch (quarter) {
                case 1 -> LocalDate.of(year, 3, 31);
                case 2 -> LocalDate.of(year, 6, 30);
                case 3 -> LocalDate.of(year, 9, 30);
                case 4 -> LocalDate.of(year, 12, 31);
                default -> LocalDate.of(year, 12, 31);
            };
        } else if (year != null && month != null) {
            startDate = LocalDate.of(year, month, 1);
            endDate = java.time.YearMonth.of(year, month).atEndOfMonth();
        } else if (year != null) {
            startDate = LocalDate.of(year, 1, 1);
            endDate = LocalDate.of(year, 12, 31);
        } else {
            // Default to current year end snapshot
            LocalDate now = LocalDate.now();
            startDate = now.with(java.time.temporal.TemporalAdjusters.firstDayOfYear());
            endDate = now.with(java.time.temporal.TemporalAdjusters.lastDayOfYear());
        }

        // Fetch accounts
        List<Account> accounts = accountRepository.findByCompany_CompanyId(companyId);

        // Fetch journal entries after endDate to adjust current balances back to endDate
        List<JournalEntry> journalEntriesAfter = journalEntryRepository.findByCompany_CompanyIdAndEntryDateBetween(
                companyId, endDate.plusDays(1), LocalDate.of(9999, 12, 31)
        );

        // Map to hold net change after endDate
        java.util.Map<Long, BigDecimal> changesAfter = new java.util.HashMap<>();
        for (JournalEntry entry : journalEntriesAfter) {
            for (JournalEntryLine line : entry.getJournalEntryLines()) {
                Account acc = line.getAccount();
                BigDecimal amount = line.getAmount();
                boolean isDebit = line.isDebit();
                BigDecimal balanceChange = calculateBalanceChange(acc.getAccountType(), isDebit, amount);

                BigDecimal existingChange = changesAfter.getOrDefault(acc.getId(), BigDecimal.ZERO);
                changesAfter.put(acc.getId(), existingChange.add(balanceChange));
            }
        }

        List<TrialBalanceLineDto> lines = new ArrayList<>();
        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;

        for (Account account : accounts) {
            BigDecimal currentBal = account.getCurrentBalance() != null ? account.getCurrentBalance() : BigDecimal.ZERO;
            BigDecimal changeAfter = changesAfter.getOrDefault(account.getId(), BigDecimal.ZERO);
            BigDecimal balanceAsOfEnd = currentBal.subtract(changeAfter);

            BigDecimal debit = BigDecimal.ZERO;
            BigDecimal credit = BigDecimal.ZERO;

            boolean isDebitNormal = account.getAccountType().isDebitType();
            if (isDebitNormal) {
                if (balanceAsOfEnd.compareTo(BigDecimal.ZERO) >= 0) {
                    debit = balanceAsOfEnd;
                } else {
                    credit = balanceAsOfEnd.abs();
                }
            } else {
                if (balanceAsOfEnd.compareTo(BigDecimal.ZERO) >= 0) {
                    credit = balanceAsOfEnd;
                } else {
                    debit = balanceAsOfEnd.abs();
                }
            }

            lines.add(new TrialBalanceLineDto(
                    account.getAccountCode(),
                    account.getAccountName(),
                    account.getAccountType().name(),
                    debit,
                    credit
            ));

            totalDebit = totalDebit.add(debit);
            totalCredit = totalCredit.add(credit);
        }

        BigDecimal difference = totalDebit.subtract(totalCredit).abs();
        boolean balanced = difference.compareTo(new BigDecimal("0.01")) < 0;

        TrialBalanceResponseDto response = new TrialBalanceResponseDto();
        response.setLines(lines);
        response.setTotalDebit(totalDebit);
        response.setTotalCredit(totalCredit);
        response.setDifference(difference);
        response.setBalanced(balanced);
        response.setAccountsCount(accounts.size());
        response.setStartDate(startDate);
        response.setEndDate(endDate);

        return response;
    }

    public CashFlowResponseDto getCashFlow(
            Integer companyId,
            String startDateStr,
            String endDateStr,
            Integer year,
            Integer quarter,
            Integer month
    ) {
        // Resolve date range
        LocalDate startDate;
        LocalDate endDate;

        if (startDateStr != null && endDateStr != null) {
            startDate = LocalDate.parse(startDateStr);
            endDate = LocalDate.parse(endDateStr);
        } else if (year != null && quarter != null) {
            startDate = switch (quarter) {
                case 1 -> LocalDate.of(year, 1, 1);
                case 2 -> LocalDate.of(year, 4, 1);
                case 3 -> LocalDate.of(year, 7, 1);
                case 4 -> LocalDate.of(year, 10, 1);
                default -> LocalDate.of(year, 1, 1);
            };
            endDate = switch (quarter) {
                case 1 -> LocalDate.of(year, 3, 31);
                case 2 -> LocalDate.of(year, 6, 30);
                case 3 -> LocalDate.of(year, 9, 30);
                case 4 -> LocalDate.of(year, 12, 31);
                default -> LocalDate.of(year, 12, 31);
            };
        } else if (year != null && month != null) {
            startDate = LocalDate.of(year, month, 1);
            endDate = java.time.YearMonth.of(year, month).atEndOfMonth();
        } else if (year != null) {
            startDate = LocalDate.of(year, 1, 1);
            endDate = LocalDate.of(year, 12, 31);
        } else {
            // Default to current year
            LocalDate now = LocalDate.now();
            startDate = now.with(java.time.temporal.TemporalAdjusters.firstDayOfYear());
            endDate = now.with(java.time.temporal.TemporalAdjusters.lastDayOfYear());
        }

        // Fetch accounts
        List<Account> accounts = accountRepository.findByCompany_CompanyId(companyId);

        // Identify Cash / Bank Accounts
        Set<Long> cashAccountIds = new HashSet<>();
        List<Account> cashAccountsList = new ArrayList<>();
        for (Account account : accounts) {
            if (account.getAccountType() == AccountType.ASSET_BANK) {
                cashAccountIds.add(account.getId());
                cashAccountsList.add(account);
            }
        }

        // Calculate Opening and Closing Cash Balances by subtracting journal entry line changes
        // after the respective dates from the current balances
        List<JournalEntry> changesAfterStart = journalEntryRepository.findByCompany_CompanyIdAndEntryDateBetween(
                companyId, startDate, LocalDate.of(9999, 12, 31)
        );
        List<JournalEntry> changesAfterEnd = journalEntryRepository.findByCompany_CompanyIdAndEntryDateBetween(
                companyId, endDate.plusDays(1), LocalDate.of(9999, 12, 31)
        );

        BigDecimal currentCashTotal = BigDecimal.ZERO;
        for (Account cashAccount : cashAccountsList) {
            currentCashTotal = currentCashTotal.add(cashAccount.getCurrentBalance() != null ? cashAccount.getCurrentBalance() : BigDecimal.ZERO);
        }

        BigDecimal netChangesAfterStart = BigDecimal.ZERO;
        for (JournalEntry entry : changesAfterStart) {
            for (JournalEntryLine line : entry.getJournalEntryLines()) {
                if (cashAccountIds.contains(line.getAccount().getId())) {
                    BigDecimal change = calculateBalanceChange(AccountType.ASSET_BANK, line.isDebit(), line.getAmount());
                    netChangesAfterStart = netChangesAfterStart.add(change);
                }
            }
        }

        BigDecimal netChangesAfterEnd = BigDecimal.ZERO;
        for (JournalEntry entry : changesAfterEnd) {
            for (JournalEntryLine line : entry.getJournalEntryLines()) {
                if (cashAccountIds.contains(line.getAccount().getId())) {
                    BigDecimal change = calculateBalanceChange(AccountType.ASSET_BANK, line.isDebit(), line.getAmount());
                    netChangesAfterEnd = netChangesAfterEnd.add(change);
                }
            }
        }

        BigDecimal openingBalance = currentCashTotal.subtract(netChangesAfterStart);
        BigDecimal closingBalance = currentCashTotal.subtract(netChangesAfterEnd);

        // Fetch journal entries inside the period to process flows
        List<JournalEntry> journalEntries = journalEntryRepository.findByCompany_CompanyIdAndEntryDateBetween(
                companyId, startDate, endDate
        );

        BigDecimal opInflows = BigDecimal.ZERO;
        BigDecimal opOutflows = BigDecimal.ZERO;
        BigDecimal invInflows = BigDecimal.ZERO;
        BigDecimal invOutflows = BigDecimal.ZERO;
        BigDecimal finInflows = BigDecimal.ZERO;
        BigDecimal finOutflows = BigDecimal.ZERO;

        for (JournalEntry entry : journalEntries) {
            // Check if this entry has a cash impact
            boolean hasCashImpact = false;
            for (JournalEntryLine line : entry.getJournalEntryLines()) {
                if (cashAccountIds.contains(line.getAccount().getId())) {
                    hasCashImpact = true;
                    break;
                }
            }

            if (!hasCashImpact) continue;

            // Classify this journal entry category by looking at non-cash offsets
            String category = "OPERATING";
            for (JournalEntryLine line : entry.getJournalEntryLines()) {
                if (!cashAccountIds.contains(line.getAccount().getId())) {
                    AccountType offsetType = line.getAccount().getAccountType();
                    if (offsetType == AccountType.ASSET_FIXED_ASSET || offsetType == AccountType.ASSET_OTHER_ASSET) {
                        category = "INVESTING";
                        break;
                    } else if (offsetType == AccountType.EQUITY || offsetType == AccountType.LIABILITY_LONG_TERM_LIABILITY) {
                        category = "FINANCING";
                        break;
                    }
                }
            }

            // Distribute cash lines in this journal entry
            for (JournalEntryLine line : entry.getJournalEntryLines()) {
                if (cashAccountIds.contains(line.getAccount().getId())) {
                    BigDecimal amt = line.getAmount();
                    boolean isDebit = line.isDebit();

                    if ("INVESTING".equals(category)) {
                        if (isDebit) {
                            invInflows = invInflows.add(amt);
                        } else {
                            invOutflows = invOutflows.add(amt);
                        }
                    } else if ("FINANCING".equals(category)) {
                        if (isDebit) {
                            finInflows = finInflows.add(amt);
                        } else {
                            finOutflows = finOutflows.add(amt);
                        }
                    } else { // OPERATING
                        if (isDebit) {
                            opInflows = opInflows.add(amt);
                        } else {
                            opOutflows = opOutflows.add(amt);
                        }
                    }
                }
            }
        }

        List<CashFlowLineDto> operatingLines = new ArrayList<>();
        operatingLines.add(new CashFlowLineDto("Receipts from Customers", opInflows, true));
        operatingLines.add(new CashFlowLineDto("Payments to Suppliers & Employees", opOutflows.negate(), false));

        List<CashFlowLineDto> investingLines = new ArrayList<>();
        investingLines.add(new CashFlowLineDto("Proceeds from Sale of Fixed Assets", invInflows, true));
        investingLines.add(new CashFlowLineDto("Payments for Purchase of Fixed Assets", invOutflows.negate(), false));

        List<CashFlowLineDto> financingLines = new ArrayList<>();
        financingLines.add(new CashFlowLineDto("Proceeds from Capital Injections & Loans", finInflows, true));
        financingLines.add(new CashFlowLineDto("Repayment of Borrowings & Dividends", finOutflows.negate(), false));

        BigDecimal netOperatingCash = opInflows.subtract(opOutflows);
        BigDecimal netInvestingCash = invInflows.subtract(invOutflows);
        BigDecimal netFinancingCash = finInflows.subtract(finOutflows);

        BigDecimal netCashFlow = netOperatingCash.add(netInvestingCash).add(netFinancingCash);
        BigDecimal totalInflows = opInflows.add(invInflows).add(finInflows);
        BigDecimal totalOutflows = opOutflows.add(invOutflows).add(finOutflows);

        CashFlowResponseDto response = new CashFlowResponseDto();
        response.setOpeningBalance(openingBalance);
        response.setClosingBalance(closingBalance);
        response.setNetCashFlow(netCashFlow);
        response.setOperatingActivities(operatingLines);
        response.setInvestingActivities(investingLines);
        response.setFinancingActivities(financingLines);
        response.setNetOperatingCash(netOperatingCash);
        response.setNetInvestingCash(netInvestingCash);
        response.setNetFinancingCash(netFinancingCash);
        response.setTotalInflows(totalInflows);
        response.setTotalOutflows(totalOutflows);
        response.setStartDate(startDate);
        response.setEndDate(endDate);

        return response;
    }

    public GeneralLedgerResponseDto getGeneralLedger(
            Integer companyId,
            String startDateStr,
            String endDateStr,
            Integer year,
            Integer quarter,
            Integer month
    ) {
        // Resolve date range
        LocalDate startDate;
        LocalDate endDate;

        if (startDateStr != null && endDateStr != null) {
            startDate = LocalDate.parse(startDateStr);
            endDate = LocalDate.parse(endDateStr);
        } else if (year != null && quarter != null) {
            startDate = switch (quarter) {
                case 1 -> LocalDate.of(year, 1, 1);
                case 2 -> LocalDate.of(year, 4, 1);
                case 3 -> LocalDate.of(year, 7, 1);
                case 4 -> LocalDate.of(year, 10, 1);
                default -> LocalDate.of(year, 1, 1);
            };
            endDate = switch (quarter) {
                case 1 -> LocalDate.of(year, 3, 31);
                case 2 -> LocalDate.of(year, 6, 30);
                case 3 -> LocalDate.of(year, 9, 30);
                case 4 -> LocalDate.of(year, 12, 31);
                default -> LocalDate.of(year, 12, 31);
            };
        } else if (year != null && month != null) {
            startDate = LocalDate.of(year, month, 1);
            endDate = java.time.YearMonth.of(year, month).atEndOfMonth();
        } else if (year != null) {
            startDate = LocalDate.of(year, 1, 1);
            endDate = LocalDate.of(year, 12, 31);
        } else {
            // Default to current year
            LocalDate now = LocalDate.now();
            startDate = now.with(java.time.temporal.TemporalAdjusters.firstDayOfYear());
            endDate = now.with(java.time.temporal.TemporalAdjusters.lastDayOfYear());
        }

        // Fetch accounts
        List<Account> accounts = accountRepository.findByCompany_CompanyId(companyId);

        // Fetch all journal entries from startDate onwards to calculate opening balances by rolling back entries
        List<JournalEntry> changesAfterStart = journalEntryRepository.findByCompany_CompanyIdAndEntryDateBetween(
                companyId, startDate, LocalDate.of(9999, 12, 31)
        );

        // Map to hold net changes after startDate
        java.util.Map<Long, BigDecimal> changesAfterStartMap = new java.util.HashMap<>();
        for (JournalEntry entry : changesAfterStart) {
            for (JournalEntryLine line : entry.getJournalEntryLines()) {
                Account acc = line.getAccount();
                BigDecimal amount = line.getAmount();
                boolean isDebit = line.isDebit();
                BigDecimal balanceChange = calculateBalanceChange(acc.getAccountType(), isDebit, amount);

                BigDecimal existingChange = changesAfterStartMap.getOrDefault(acc.getId(), BigDecimal.ZERO);
                changesAfterStartMap.put(acc.getId(), existingChange.add(balanceChange));
            }
        }

        // Fetch journal entries in period
        List<JournalEntry> periodEntries = journalEntryRepository.findByCompany_CompanyIdAndEntryDateBetween(
                companyId, startDate, endDate
        );

        // Sort journal entries by entryDate and ID to guarantee chronological order
        periodEntries.sort((a, b) -> {
            int dateCompare = a.getEntryDate().compareTo(b.getEntryDate());
            if (dateCompare != 0) return dateCompare;
            return a.getId().compareTo(b.getId());
        });

        List<GeneralLedgerResponseDto.GeneralLedgerAccountDto> accountDtos = new ArrayList<>();
        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;
        int totalTransactionsCount = 0;

        for (Account account : accounts) {
            BigDecimal currentBal = account.getCurrentBalance() != null ? account.getCurrentBalance() : BigDecimal.ZERO;
            BigDecimal changeAfterStart = changesAfterStartMap.getOrDefault(account.getId(), BigDecimal.ZERO);
            BigDecimal openingBalance = currentBal.subtract(changeAfterStart);

            GeneralLedgerResponseDto.GeneralLedgerAccountDto accDto = new GeneralLedgerResponseDto.GeneralLedgerAccountDto();
            accDto.setAccountCode(account.getAccountCode());
            accDto.setAccountName(account.getAccountName());
            accDto.setAccountType(account.getAccountType().name());
            accDto.setOpeningBalance(openingBalance);

            List<GeneralLedgerResponseDto.GeneralLedgerTransactionDto> txList = new ArrayList<>();
            BigDecimal runningBalance = openingBalance;

            // Find all lines of period entries matching this account
            for (JournalEntry entry : periodEntries) {
                for (JournalEntryLine line : entry.getJournalEntryLines()) {
                    if (line.getAccount().getId().equals(account.getId())) {
                        BigDecimal amount = line.getAmount();
                        boolean isDebit = line.isDebit();

                        BigDecimal debitAmt = isDebit ? amount : BigDecimal.ZERO;
                        BigDecimal creditAmt = isDebit ? BigDecimal.ZERO : amount;

                        BigDecimal balanceChange = calculateBalanceChange(account.getAccountType(), isDebit, amount);
                        runningBalance = runningBalance.add(balanceChange);

                        String desc = line.getDescription() != null ? line.getDescription() : entry.getDescription();
                        if (desc == null || desc.trim().isEmpty()) {
                            desc = entry.getJournalTitle() != null ? entry.getJournalTitle() : "General Ledger Posting";
                        }

                        txList.add(new GeneralLedgerResponseDto.GeneralLedgerTransactionDto(
                                entry.getEntryDate(),
                                entry.getReferenceNo() != null ? entry.getReferenceNo() : "JE-" + entry.getId(),
                                desc,
                                debitAmt,
                                creditAmt,
                                runningBalance
                        ));

                        totalDebit = totalDebit.add(debitAmt);
                        totalCredit = totalCredit.add(creditAmt);
                        totalTransactionsCount++;
                    }
                }
            }

            accDto.setTransactions(txList);
            accDto.setClosingBalance(runningBalance);
            accountDtos.add(accDto);
        }

        BigDecimal netBalance = totalDebit.subtract(totalCredit);

        GeneralLedgerResponseDto response = new GeneralLedgerResponseDto();
        response.setAccounts(accountDtos);
        response.setTotalAccounts(accounts.size());
        response.setTotalDebit(totalDebit);
        response.setTotalCredit(totalCredit);
        response.setNetBalance(netBalance);
        response.setTotalTransactions(totalTransactionsCount);
        response.setStartDate(startDate);
        response.setEndDate(endDate);

        return response;
    }

    private BigDecimal calculateBalanceChange(AccountType accountType, boolean isDebit, BigDecimal amount) {
        boolean isDebitNormal = accountType.isDebitType();
        if (isDebitNormal) {
            return isDebit ? amount : amount.negate();
        } else {
            return isDebit ? amount.negate() : amount;
        }
    }
}
