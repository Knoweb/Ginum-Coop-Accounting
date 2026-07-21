package com.example.GinumApps.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PurchasePaymentRequestDto {
    @NotNull
    private BigDecimal amount;

    @NotBlank
    private String paymentAccountCode;

    private String paymentNote;

    @NotNull
    private Integer companyId;
}

