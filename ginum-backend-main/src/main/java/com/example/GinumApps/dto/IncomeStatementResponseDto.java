package com.example.GinumApps.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class IncomeStatementResponseDto {
    private List<IncomeStatementLineDto> revenue;
    private List<IncomeStatementLineDto> costOfGoodsSold;
    private List<IncomeStatementLineDto> operatingExpenses;
    private List<IncomeStatementLineDto> otherIncome;
    private List<IncomeStatementLineDto> otherExpenses;

    private BigDecimal totalRevenue;
    private BigDecimal totalCostOfGoodsSold;
    private BigDecimal grossProfit;
    private BigDecimal totalOperatingExpenses;
    private BigDecimal operatingProfit;
    private BigDecimal totalOtherIncome;
    private BigDecimal totalOtherExpenses;
    private BigDecimal netProfitLoss;

    private LocalDate startDate;
    private LocalDate endDate;

    @Data
    public static class IncomeStatementLineDto {
        private String accountName;
        private String accountCode;
        private BigDecimal balance;

        public IncomeStatementLineDto(String accountName, String accountCode, BigDecimal balance) {
            this.accountName = accountName;
            this.accountCode = accountCode;
            this.balance = balance;
        }
    }
}
