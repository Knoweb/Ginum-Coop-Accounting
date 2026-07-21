package com.example.GinumApps.dto;

import com.example.GinumApps.enums.PurchaseType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
public class PurchaseOrderRequestDto {

    @NotNull(message = "Supplier ID is required")
    private Long supplierId;

    @NotBlank(message = "Supplier invoice number is required")
    private String supplierInvoiceNumber;

    @NotBlank(message = "Supplier po number is required")
    private String poNumber;

    @NotNull(message = "Issue date is required")
    private LocalDate issueDate;

    private LocalDate dueDate;

    private LocalDate promiseDate;

    private String notes;

    @Valid
    @NotEmpty
    private List<PurchaseOrderItemRequestDto> items;

    @DecimalMin(value = "0.00", message = "Freight cannot be negative")
    private BigDecimal freight = BigDecimal.ZERO;

    @DecimalMin(value = "0.00", message = "Tax cannot be negative")
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @DecimalMin(value = "0.00", message = "Amount paid cannot be negative")
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @NotNull(message = "Purchase type is required")
    private PurchaseType purchaseType;

    private String paymentAccountCode;
}