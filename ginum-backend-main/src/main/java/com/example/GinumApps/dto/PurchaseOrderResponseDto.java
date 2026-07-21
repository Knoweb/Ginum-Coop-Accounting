package com.example.GinumApps.dto;

import com.example.GinumApps.enums.PurchaseType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class PurchaseOrderResponseDto {
    private Long id;
    private String purchaseOrderNumber;
    private Long supplierId;
    private String supplierName;
    private String supplierInvoiceNumber;
    private LocalDate issueDate;
    private LocalDate promiseDate;
    private String notes;
    private BigDecimal subtotal;
    private BigDecimal freight;
    private BigDecimal taxAmount;
    private BigDecimal total;
    private BigDecimal amountPaid;
    private BigDecimal balanceDue;
    private PurchaseType purchaseType;
    private List<PurchaseOrderItemResponseDto> items;
    private String journalEntryReference;
    private String tradeTransactionReference;
}