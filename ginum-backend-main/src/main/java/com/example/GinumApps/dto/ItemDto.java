package com.example.GinumApps.dto;

import com.example.GinumApps.enums.ItemType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemDto {

    private Long itemId;

    private String itemCode;

    @NotBlank(message = "Item name is required")
    private String name;

    private String category;

    private ItemType itemType;

    private String description;

    @DecimalMin(value = "0.00", message = "Purchase price cannot be negative")
    private BigDecimal purchasePrice;

    @NotNull(message = "Selling price is required")
    @DecimalMin(value = "0.01", message = "Selling price must be greater than 0")
    private BigDecimal unitPrice;

    @DecimalMin(value = "0.00", message = "Current stock cannot be negative")
    private BigDecimal currentStock;

    @Min(value = 0, message = "Reorder level cannot be negative")
    private Integer reorderLevel;

    private String unit;

    private Boolean active;
}