package com.example.GinumApps.dto;

import com.example.GinumApps.enums.LineItemType;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class SalesOrderItemResponseDto {
    private Long itemId;
    private String itemName;
    private String description;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal discountPercent;
    private BigDecimal amount;
    private String accountCode;
    private Long projectId;
    private LineItemType itemType;
}
