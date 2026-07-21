package com.example.GinumApps.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class SalesPaymentRequestDto {
    @NotNull
    private BigDecimal amount;

    @NotBlank
    private String paymentAccountCode;

    @NotNull
    private Integer companyId;
}

