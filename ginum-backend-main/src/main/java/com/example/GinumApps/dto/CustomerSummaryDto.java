package com.example.GinumApps.dto;

import com.example.GinumApps.enums.CustomerType;
import com.example.GinumApps.enums.TaxType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CustomerSummaryDto {
    private Long customerId;
    private String customerName;
    private String email;
    private String mobileNo;
    private String address;
    private CustomerType customerType;
    private TaxType tax;
}