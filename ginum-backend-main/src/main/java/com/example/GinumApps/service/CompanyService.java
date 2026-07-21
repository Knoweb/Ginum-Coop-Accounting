// CompanyService.java
package com.example.GinumApps.service;

import com.example.GinumApps.dto.AccountRequestDto;
import com.example.GinumApps.dto.CompanyRegistrationDto;
import com.example.GinumApps.dto.CompanyResponseDto;
import com.example.GinumApps.enums.AccountType;
import com.example.GinumApps.exception.DuplicateEntityException;
import com.example.GinumApps.model.*;
import com.example.GinumApps.repository.CompanyRepository;
import com.example.GinumApps.repository.CountryRepository;
import com.example.GinumApps.repository.CurrencyRepository;
import com.example.GinumApps.repository.SubscriptionPackageRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final SubscriptionPackageRepository subscriptionPackageRepository;
    private final CountryRepository countryRepository;
    private final CurrencyRepository currencyRepository;
    private final AccountService accountService;

    @Transactional
    public Company registerCompany(CompanyRegistrationDto dto) {
        // Check for duplicate email
        if (companyRepository.existsByEmail(dto.getEmail())) {
            throw new DuplicateEntityException("Email already registered");
        }


        // Check for duplicate registration number (if provided)
        if (dto.getCompanyRegNo() != null &&
                companyRepository.existsByCompanyRegNo(dto.getCompanyRegNo())) {
            throw new DuplicateEntityException("Company registration number already exists");
        }

        // Fetch the Package entity based on the provided packageId or use default (ID 1)
        Integer reqPackageId = dto.getPackageId() != null ? dto.getPackageId() : 1;
        SubscriptionPackage subscriptionPackageEntity = subscriptionPackageRepository.findById(reqPackageId)
                .orElseThrow(() -> new EntityNotFoundException("Package not found with ID: " + reqPackageId));

        // Fetch the Country entity based on the provided country ID
        Country countryEntity = countryRepository.findById(dto.getCountryId())
                .orElseThrow(() -> new EntityNotFoundException("Country not found: " + dto.getCountryId()));

        // Fetch the Currency entity based on the provided currency ID
        Currency currencyEntity = currencyRepository.findById(dto.getCurrencyId())
                .orElseThrow(() -> new EntityNotFoundException("Currency not found: " + dto.getCurrencyId()));


        // Map DTO to Company entity
        Company company = new Company();
        company.setCompanyName(dto.getCompanyName());
        company.setCompanyCategory(dto.getCompanyCategory());
        company.setCompanyRegNo(dto.getCompanyRegNo());
        company.setTinNo(dto.getTinNo());
        company.setVatNo(dto.getVatNo());
        company.setIsVatRegistered(dto.getIsVatRegistered());
        company.setPhoneNo(dto.getPhoneNo());
        company.setMobileNo(dto.getMobileNo());
        company.setCompanyRegisteredAddress(dto.getCompanyRegisteredAddress());
        company.setCompanyFactoryAddress(dto.getCompanyFactoryAddress());

        company.setEmail(dto.getEmail());
        company.setWebsiteUrl(dto.getWebsiteUrl());
        company.setPassword(passwordEncoder.encode(dto.getPassword()));
        company.setDateJoined(LocalDate.now());

        company.setPackageEntity(subscriptionPackageEntity);
        company.setCountry(countryEntity);
        company.setCurrency(currencyEntity);

        // Set default values
        company.setStatus(true); // Assuming active on registration
        company.setRole("COMPANY");
//        company.setDateUpdated(LocalDate.now());

        try {
            if (dto.getCompanyLogo() != null && !dto.getCompanyLogo().isEmpty()) {
                company.setCompanyLogo(dto.getCompanyLogo().getBytes());
            }
            if (dto.getBrReport() != null && !dto.getBrReport().isEmpty()) {
                company.setBrReport(dto.getBrReport().getBytes());
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to read logo or report file", e);
        }

        Company savedCompany = companyRepository.save(company);

        // Default accounts are no longer auto-created per requirement

        return savedCompany;
    }

    public Optional<Company> getCompanyById(Integer id) {
        return companyRepository.findById(id);
    }



    public List<CompanyResponseDto> getAllCompanies() {
        List<Company> companies = companyRepository.findAll();
        return companies.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    public CompanyResponseDto convertToDto(Company company) {
        CompanyResponseDto dto = new CompanyResponseDto();
        dto.setCompanyId(company.getCompanyId());
        dto.setCompanyName(company.getCompanyName());
        dto.setCompanyCategory(company.getCompanyCategory());
        dto.setCompanyRegNo(company.getCompanyRegNo());
        dto.setIsVatRegistered(company.getIsVatRegistered());
        dto.setVatNo(company.getVatNo());
        dto.setTinNo(company.getTinNo());
        dto.setCompanyRegisteredAddress(company.getCompanyRegisteredAddress());
        dto.setCompanyFactoryAddress(company.getCompanyFactoryAddress());
        dto.setPhoneNo(company.getPhoneNo());
        dto.setMobileNo(company.getMobileNo());
        dto.setEmail(company.getEmail());
        dto.setWebsiteUrl(company.getWebsiteUrl());
        dto.setDateJoined(company.getDateJoined());
//        dto.setCompanyLogo(company.getCompanyLogo());
//        dto.setBrReportPath(company.getBrReportPath());
        dto.setCountryName(company.getCountry().getName());
        dto.setCurrencyCode(company.getCurrency().getCode());
        dto.setStatus(company.getStatus());
        dto.setSubscriptionExpiryDate(company.getSubscriptionExpiryDate());

        if (company.getPackageEntity() != null) {
            dto.setSubscriptionPackageId(company.getPackageEntity().getId());
        }
        if (company.getCompanyLogo() != null) {
            dto.setCompanyLogoBase64(Base64.getEncoder().encodeToString(company.getCompanyLogo()));
        }
        return dto;
    }
}