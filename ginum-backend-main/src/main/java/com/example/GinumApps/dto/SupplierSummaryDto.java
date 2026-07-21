package com.example.GinumApps.dto;

import com.example.GinumApps.enums.SupplierType;
import com.example.GinumApps.enums.TaxType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SupplierSummaryDto {
    private Long id;
    private String supplierName;
    private String email;
    private String mobileNo;
    private String address;
    private SupplierType supplierType;
    private TaxType tax;
    private String itemCategory;
    private String tinNo;
    private String swiftNo;
    private Double discountPercentage;
    private Boolean active;
}