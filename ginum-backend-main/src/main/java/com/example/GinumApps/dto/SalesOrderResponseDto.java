package com.example.GinumApps.dto;

import com.example.GinumApps.enums.SalesType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class SalesOrderResponseDto {
    private Long id;
    private String soNumber;
    private Long customerId;
    private String customerName;
    private String customerInvoiceNumber;
    private LocalDate issueDate;
    private LocalDate dueDate;
    private String notes;
    private BigDecimal subtotal;
//    private BigDecimal freight;
//    private BigDecimal taxAmount;
    private BigDecimal total;
    private BigDecimal amountPaid;
    private BigDecimal balanceDue;
    private SalesType salesType;
    private List<SalesOrderItemResponseDto> items;
}
