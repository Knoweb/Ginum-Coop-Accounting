package com.example.GinumApps.dto;

import com.example.GinumApps.enums.AccountType;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class AccountRequestDto {
    @NotBlank(message = "Account name is required")
    private String accountName;

    private String subAccountName;

    @NotNull(message = "Account type is required")
    private AccountType accountType;

    @NotNull(message = "Current balance is required")
    @DecimalMin(value = "0.0", message = "Balance cannot be negative")
    private BigDecimal currentBalance;
    private String accountCode; // Added field

//    @NotNull(message = "Company ID is required")
//    private Integer companyId;
}
