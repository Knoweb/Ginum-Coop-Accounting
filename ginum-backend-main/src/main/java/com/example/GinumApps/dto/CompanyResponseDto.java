// CompanyResponseDto.java
package com.example.GinumApps.dto;

import com.example.GinumApps.enums.CompanyCategory;
import com.example.GinumApps.model.Country;
import com.example.GinumApps.model.Currency;
import lombok.Data;
import java.time.LocalDate;
import java.util.Date;

@Data
public class CompanyResponseDto {
    private Integer companyId;
    private String companyName;
    private CompanyCategory companyCategory;
    private String companyRegNo;
    private Boolean isVatRegistered;
    private String vatNo;
    private String tinNo;
    private String companyRegisteredAddress;
    private String companyFactoryAddress;
    private String phoneNo;
    private String mobileNo;
    private String email;
    private String websiteUrl;
    private LocalDate dateJoined;
//    private String imgPath;
//    private String brReportPath;
    private String countryName;
    private String currencyCode;
    private Boolean status;
    private Date subscriptionExpiryDate;
    private Integer subscriptionPackageId;
    private String companyLogoBase64;
}