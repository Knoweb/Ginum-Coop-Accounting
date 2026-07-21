package com.example.GinumApps.dto;

import com.example.GinumApps.enums.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AccountEditRequestDto {
    @NotBlank(message = "Account name is required")
    private String accountName;

    private String subAccountName;

    @NotNull(message = "Account type is required")
    private AccountType accountType;
}
