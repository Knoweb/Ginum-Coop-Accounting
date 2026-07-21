// CompanyRegistrationDto.java
package com.example.GinumApps.dto;

import com.example.GinumApps.enums.CompanyCategory;
import com.example.GinumApps.model.Country;
import com.example.GinumApps.model.Currency;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.LocalDate;

@Data
public class CompanyRegistrationDto {
    @NotBlank @Size(max = 30)
    private String companyName;

    private MultipartFile companyLogo;

    private MultipartFile brReport;

    @NotNull
    private CompanyCategory companyCategory;

    @Size(max = 20)
    private String companyRegNo;

    @Size(max = 20)
    private String tinNo;

    @NotNull
    private Boolean isVatRegistered;

    @Size(max = 20)
    private String vatNo;

    @NotBlank @Size(max = 15)
    private String phoneNo;

    @Size(max = 15)
    private String mobileNo;

    @NotBlank @Size(max = 200)
    private String companyRegisteredAddress;

    @Size(max = 200)
    private String companyFactoryAddress;

    @NotNull
    private Integer countryId;

    @NotNull
    private Integer currencyId;

    @NotBlank @Email @Size(max = 30)
    private String email;

    @Size(max = 20)
    private String websiteUrl;

    @NotBlank @Size(min = 6, max = 50)
    private String password;

    @NotNull
    private LocalDate dateJoined;

    private Integer packageId;
}