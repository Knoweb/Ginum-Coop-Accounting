package com.example.GinumApps.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class CashFlowResponseDto {
    private BigDecimal openingBalance;
    private BigDecimal closingBalance;
    private BigDecimal netCashFlow;
    
    private List<CashFlowLineDto> operatingActivities;
    private List<CashFlowLineDto> investingActivities;
    private List<CashFlowLineDto> financingActivities;

    private BigDecimal netOperatingCash;
    private BigDecimal netInvestingCash;
    private BigDecimal netFinancingCash;
    
    private BigDecimal totalInflows;
    private BigDecimal totalOutflows;

    private LocalDate startDate;
    private LocalDate endDate;

    @Data
    public static class CashFlowLineDto {
        private String description;
        private BigDecimal amount;
        private boolean inflow;

        public CashFlowLineDto(String description, BigDecimal amount, boolean inflow) {
            this.description = description;
            this.amount = amount;
            this.inflow = inflow;
        }
    }
}
