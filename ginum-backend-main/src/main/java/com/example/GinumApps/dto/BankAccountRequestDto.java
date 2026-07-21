package com.example.GinumApps.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class BankAccountRequestDto {
    @NotBlank(message = "Bank name is required")
    private String bankName;

    @NotBlank(message = "Branch name is required")
    private String branchName;

    @NotBlank(message = "Account number is required")
//    @Pattern(regexp = "^[A-Z0-9]{8,20}$", message = "Invalid account number format")
    private String accountNumber;

    private String subAccountName;

    @NotNull(message = "Current balance is required")
    @DecimalMin(value = "0.0", message = "Balance cannot be negative")
    private BigDecimal currentBalance;

//    @NotNull(message = "Company ID is required")
//    private Integer companyId;

    private String accountName; // Optional
}