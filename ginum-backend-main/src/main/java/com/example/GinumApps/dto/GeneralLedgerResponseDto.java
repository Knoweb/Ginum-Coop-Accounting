package com.example.GinumApps.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class GeneralLedgerResponseDto {
    private List<GeneralLedgerAccountDto> accounts;
    private int totalAccounts;
    private BigDecimal totalDebit;
    private BigDecimal totalCredit;
    private BigDecimal netBalance;
    private int totalTransactions;
    private LocalDate startDate;
    private LocalDate endDate;

    @Data
    public static class GeneralLedgerAccountDto {
        private String accountCode;
        private String accountName;
        private String accountType;
        private BigDecimal openingBalance;
        private BigDecimal closingBalance;
        private List<GeneralLedgerTransactionDto> transactions;
    }

    @Data
    public static class GeneralLedgerTransactionDto {
        private LocalDate date;
        private String reference;
        private String description;
        private BigDecimal debit;
        private BigDecimal credit;
        private BigDecimal runningBalance;

        public GeneralLedgerTransactionDto(LocalDate date, String reference, String description, BigDecimal debit, BigDecimal credit, BigDecimal runningBalance) {
            this.date = date;
            this.reference = reference;
            this.description = description;
            this.debit = debit;
            this.credit = credit;
            this.runningBalance = runningBalance;
        }
    }
}
