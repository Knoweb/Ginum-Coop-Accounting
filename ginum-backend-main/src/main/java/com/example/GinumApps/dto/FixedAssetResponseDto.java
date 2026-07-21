package com.example.GinumApps.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class FixedAssetResponseDto {
    private Long id;
    private String name;
    private BigDecimal purchaseCost;
    private LocalDate purchaseDate;
    private Integer usefulLife;
    private String depreciationMethod;

    // Calculated fields
    private BigDecimal annualDepreciation;
    private BigDecimal monthlyDepreciation;
    private BigDecimal accumulatedDepreciation;
    private BigDecimal bookValue;
}
