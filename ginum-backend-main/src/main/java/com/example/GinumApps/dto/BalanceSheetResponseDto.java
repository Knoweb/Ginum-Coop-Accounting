package com.example.GinumApps.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class BalanceSheetResponseDto {
    private List<BalanceSheetLineDto> currentAssets;
    private List<BalanceSheetLineDto> nonCurrentAssets;
    private List<BalanceSheetLineDto> currentLiabilities;
    private List<BalanceSheetLineDto> nonCurrentLiabilities;
    private List<BalanceSheetLineDto> equity;

    private BigDecimal netProfitLoss;
    private BigDecimal totalAssets;
    private BigDecimal totalLiabilities;
    private BigDecimal totalEquity;
    
    private boolean balanced;

    @Data
    public static class BalanceSheetLineDto {
        private String accountName;
        private String accountCode;
        private BigDecimal balance;

        public BalanceSheetLineDto(String accountName, String accountCode, BigDecimal balance) {
            this.accountName = accountName;
            this.accountCode = accountCode;
            this.balance = balance;
        }
    }
}
