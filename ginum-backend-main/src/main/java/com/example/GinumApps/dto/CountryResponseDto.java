package com.example.GinumApps.dto;

import lombok.Data;

@Data
public class CountryResponseDto {
    private Integer id;
    private String name;
    private Integer defaultCurrencyId;
    private String defaultCurrencyCode;
    private String defaultCurrencySymbol;
}
