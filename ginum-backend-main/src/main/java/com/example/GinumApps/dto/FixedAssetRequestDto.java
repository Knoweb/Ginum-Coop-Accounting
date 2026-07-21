package com.example.GinumApps.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class FixedAssetRequestDto {
    private String name;
    private BigDecimal purchaseCost;
    private LocalDate purchaseDate;
    private Integer usefulLife;
    private String depreciationMethod;
}
