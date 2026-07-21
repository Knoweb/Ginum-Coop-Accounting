package com.example.GinumApps.service;

import com.example.GinumApps.dto.SupplierDto;
import com.example.GinumApps.dto.SupplierSummaryDto;
import com.example.GinumApps.dto.SupplierUpdateDto;
import com.example.GinumApps.exception.ResourceNotFoundException;
import com.example.GinumApps.model.Company;
import com.example.GinumApps.model.Currency;
import com.example.GinumApps.model.Supplier;
import com.example.GinumApps.repository.CompanyRepository;
import com.example.GinumApps.repository.CurrencyRepository;
import com.example.GinumApps.repository.PurchaseOrderRepository;
import com.example.GinumApps.repository.SupplierRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final CurrencyRepository currencyRepository;
    private final CompanyRepository companyRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;

    @Transactional
    public Supplier createSupplier(SupplierDto supplierDto, Integer companyId) throws IOException {

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Company not found with id: " + companyId
                ));

        Currency currency = currencyRepository.findById(supplierDto.getCurrencyId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Currency not found with id: " + supplierDto.getCurrencyId()
                ));

        Supplier supplier = new Supplier();

        supplier.setCompany(company);
        supplier.setSupplierName(supplierDto.getSupplierName());
        supplier.setEmail(supplierDto.getEmail());
        supplier.setMobileNo(supplierDto.getMobileNo());
        supplier.setAddress(supplierDto.getAddress());
        supplier.setSupplierType(supplierDto.getSupplierType());
        supplier.setTinNo(supplierDto.getTinNo());
        supplier.setTax(supplierDto.getTax());
        supplier.setCurrency(currency);
        supplier.setItemCategory(supplierDto.getItemCategory());
        supplier.setSwiftNo(supplierDto.getSwiftNo());
        supplier.setDiscountPercentage(supplierDto.getDiscountPercentage());
        supplier.setActive(true);

        if (supplierDto.getBusinessRegistration() != null &&
                !supplierDto.getBusinessRegistration().isEmpty()) {
            supplier.setBusinessRegistration(
                    supplierDto.getBusinessRegistration().getBytes()
            );
        }

        return supplierRepository.save(supplier);
    }

    public List<SupplierSummaryDto> getSuppliersByCompanyId(Integer companyId) {

        companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Company not found with id: " + companyId
                ));

        return supplierRepository.findByCompany_CompanyId(companyId)
                .stream()
                .map(this::convertToSummaryDto)
                .collect(Collectors.toList());
    }

    public List<SupplierSummaryDto> getActiveSuppliersByCompanyId(Integer companyId) {

        companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Company not found with id: " + companyId
                ));

        return supplierRepository.findByCompany_CompanyIdAndActiveTrue(companyId)
                .stream()
                .map(this::convertToSummaryDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public SupplierSummaryDto updateSupplier(Long supplierId, SupplierUpdateDto request) {

        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Supplier not found with id: " + supplierId
                ));

        supplier.setSupplierName(request.getSupplierName());
        supplier.setEmail(request.getEmail());
        supplier.setMobileNo(request.getMobileNo());
        supplier.setAddress(request.getAddress());
        supplier.setSupplierType(request.getSupplierType());
        supplier.setTinNo(request.getTinNo());
        supplier.setTax(request.getTax());
        supplier.setItemCategory(request.getItemCategory());
        supplier.setSwiftNo(request.getSwiftNo());
        supplier.setDiscountPercentage(request.getDiscountPercentage());

        if (request.getCurrencyId() != null) {
            Currency currency = currencyRepository.findById(request.getCurrencyId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Currency not found with id: " + request.getCurrencyId()
                    ));

            supplier.setCurrency(currency);
        }

        if (request.getActive() != null) {
            supplier.setActive(request.getActive());
        }

        Supplier savedSupplier = supplierRepository.save(supplier);

        return convertToSummaryDto(savedSupplier);
    }

    @Transactional
    public SupplierSummaryDto updateSupplierActiveStatus(Long supplierId, Boolean active) {

        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Supplier not found with id: " + supplierId
                ));

        supplier.setActive(active);

        Supplier savedSupplier = supplierRepository.save(supplier);

        return convertToSummaryDto(savedSupplier);
    }

    @Transactional
    public void deleteSupplierIfNoTransactions(Long supplierId) {

        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Supplier not found with id: " + supplierId
                ));

        boolean hasPurchaseOrders =
                purchaseOrderRepository.existsBySupplier_Id(supplierId);

        if (hasPurchaseOrders) {
            throw new IllegalStateException(
                    "Cannot delete this supplier because purchase transactions exist. Please deactivate the supplier instead."
            );
        }

        supplierRepository.delete(supplier);
    }

    private SupplierSummaryDto convertToSummaryDto(Supplier supplier) {

        return SupplierSummaryDto.builder()
                .id(supplier.getId())
                .supplierName(supplier.getSupplierName())
                .email(supplier.getEmail())
                .mobileNo(supplier.getMobileNo())
                .address(supplier.getAddress())
                .supplierType(supplier.getSupplierType())
                .tax(supplier.getTax())
                .itemCategory(
                        supplier.getItemCategory() != null
                                ? supplier.getItemCategory().name()
                                : null
                )
                .tinNo(supplier.getTinNo())
                .swiftNo(supplier.getSwiftNo())
                .discountPercentage(supplier.getDiscountPercentage())
                .active(supplier.getActive())
                .build();
    }
}