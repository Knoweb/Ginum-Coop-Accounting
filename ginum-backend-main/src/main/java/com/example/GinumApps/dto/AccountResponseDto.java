package com.example.GinumApps.dto;

import com.example.GinumApps.enums.AccountType;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AccountResponseDto {
    private Long id;
    private String accountName;
    private String subAccountName;
    private AccountType accountType;
    private BigDecimal currentBalance;
    private String accountCode;
    private Boolean active;

    // Bank-specific fields (nullable)
//    private String bankName;
//    private String branchName;
//    private String accountNumber;
}
