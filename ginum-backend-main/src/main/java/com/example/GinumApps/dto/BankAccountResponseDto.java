package com.example.GinumApps.dto;

import com.example.GinumApps.enums.AccountType;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class BankAccountResponseDto {
    private Long id;
    private String accountName;
    private AccountType accountType;
    private BigDecimal currentBalance;
    private String accountCode;
    private String bankName;
    private String branchName;
    private String accountNumber;
}
