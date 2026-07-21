package com.example.GinumApps.dto;

import com.example.GinumApps.enums.SalesType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class SalesOrderRequestDto {
    @NotNull
    private Long customerId;

    @NotBlank
    private String soNumber;

    @NotNull
    private LocalDate issueDate;

    private LocalDate dueDate;

    private String notes;

    @Valid
    @NotEmpty
    private List<SalesOrderItemRequestDto> items;

    @DecimalMin("0.00")
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @NotNull
    private SalesType salesType;

    private String paymentAccountCode;

    // Optional only. Company id mainly comes from URL path.
    private Integer companyId;
}