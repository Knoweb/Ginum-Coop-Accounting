package com.example.GinumApps.service;

import com.example.GinumApps.dto.FixedAssetRequestDto;
import com.example.GinumApps.dto.FixedAssetResponseDto;
import com.example.GinumApps.exception.ResourceNotFoundException;
import com.example.GinumApps.model.Company;
import com.example.GinumApps.model.FixedAsset;
import com.example.GinumApps.repository.CompanyRepository;
import com.example.GinumApps.repository.FixedAssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FixedAssetService {

    private final FixedAssetRepository fixedAssetRepo;
    private final CompanyRepository companyRepo;

    @Transactional(readOnly = true)
    public List<FixedAssetResponseDto> getFixedAssetsByCompany(Integer companyId) {
        return fixedAssetRepo.findByCompany_CompanyId(companyId)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public FixedAssetResponseDto createFixedAsset(FixedAssetRequestDto request, Integer companyId) {
        Company company = companyRepo.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        FixedAsset asset = new FixedAsset();
        asset.setName(request.getName());
        asset.setPurchaseCost(request.getPurchaseCost());
        asset.setPurchaseDate(request.getPurchaseDate());
        asset.setUsefulLife(request.getUsefulLife());
        asset.setDepreciationMethod(request.getDepreciationMethod() != null ? request.getDepreciationMethod() : "Straight Line");
        asset.setCompany(company);

        FixedAsset saved = fixedAssetRepo.save(asset);
        return convertToDto(saved);
    }

    @Transactional
    public void deleteFixedAsset(Long assetId) {
        FixedAsset asset = fixedAssetRepo.findById(assetId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found"));
        fixedAssetRepo.delete(asset);
    }

    private FixedAssetResponseDto convertToDto(FixedAsset asset) {
        FixedAssetResponseDto dto = new FixedAssetResponseDto();
        dto.setId(asset.getId());
        dto.setName(asset.getName());
        dto.setPurchaseCost(asset.getPurchaseCost());
        dto.setPurchaseDate(asset.getPurchaseDate());
        dto.setUsefulLife(asset.getUsefulLife());
        dto.setDepreciationMethod(asset.getDepreciationMethod());

        // Math calculations
        BigDecimal cost = asset.getPurchaseCost();
        BigDecimal usefulLifeYears = BigDecimal.valueOf(asset.getUsefulLife());

        if (usefulLifeYears.compareTo(BigDecimal.ZERO) <= 0) {
            usefulLifeYears = BigDecimal.ONE;
        }

        // Straight Line Method:
        BigDecimal annualDep = cost.divide(usefulLifeYears, 2, RoundingMode.HALF_UP);
        BigDecimal monthlyDep = annualDep.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);

        // Months elapsed since purchase date
        LocalDate today = LocalDate.now();
        LocalDate purchase = asset.getPurchaseDate();
        long elapsedMonths = 0;

        if (purchase.isBefore(today)) {
            Period period = Period.between(purchase, today);
            elapsedMonths = period.getYears() * 12L + period.getMonths();
        }

        BigDecimal accumDep = monthlyDep.multiply(BigDecimal.valueOf(elapsedMonths));
        if (accumDep.compareTo(cost) > 0) {
            accumDep = cost;
        }

        BigDecimal bookValue = cost.subtract(accumDep);

        dto.setAnnualDepreciation(annualDep);
        dto.setMonthlyDepreciation(monthlyDep);
        dto.setAccumulatedDepreciation(accumDep);
        dto.setBookValue(bookValue);

        return dto;
    }
}
