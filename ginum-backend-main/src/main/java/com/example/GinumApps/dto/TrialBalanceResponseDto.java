package com.example.GinumApps.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class TrialBalanceResponseDto {
    private List<TrialBalanceLineDto> lines;
    private BigDecimal totalDebit;
    private BigDecimal totalCredit;
    private BigDecimal difference;
    private boolean balanced;
    private int accountsCount;
    private LocalDate startDate;
    private LocalDate endDate;

    @Data
    public static class TrialBalanceLineDto {
        private String accountCode;
        private String accountName;
        private String accountType;
        private BigDecimal debit;
        private BigDecimal credit;

        public TrialBalanceLineDto(String accountCode, String accountName, String accountType, BigDecimal debit, BigDecimal credit) {
            this.accountCode = accountCode;
            this.accountName = accountName;
            this.accountType = accountType;
            this.debit = debit;
            this.credit = credit;
        }
    }
}
