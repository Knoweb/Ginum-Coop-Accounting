// CompanyRegistrationController.java
package com.example.GinumApps.controller;

import com.example.GinumApps.dto.CompanyRegistrationDto;
import com.example.GinumApps.dto.CompanyResponseDto;
import com.example.GinumApps.exception.DuplicateEntityException;
import com.example.GinumApps.model.Company;
import com.example.GinumApps.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
public class CompanyRegistrationController {

    private final CompanyService companyService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> registerCompany(
            @RequestPart("company") @Valid CompanyRegistrationDto dto,
            @RequestPart(value = "companyLogo", required = false) MultipartFile companyLogo,
            @RequestPart(value = "brReport", required = false) MultipartFile brReport
    ) throws IOException {

        if (companyLogo != null && !companyLogo.isEmpty()) {
            dto.setCompanyLogo(companyLogo);
        }
        if (brReport != null && !brReport.isEmpty()) {
            dto.setBrReport(brReport);
        }

        companyService.registerCompany(dto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(Collections.singletonMap("message", "Company created successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCompanyById(@PathVariable Integer id) {
        Optional<Company> optionalCompany = companyService.getCompanyById(id);
        if (optionalCompany.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Company not found");
        }
        CompanyResponseDto dto = companyService.convertToDto(optionalCompany.get());
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{id}/brReport")
    public ResponseEntity<?> getBrReport(@PathVariable Integer id) {
        Optional<Company> optionalCompany = companyService.getCompanyById(id);
        if (optionalCompany.isEmpty() || optionalCompany.get().getBrReport() == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("BR Report not found");
        }
        byte[] brReport = optionalCompany.get().getBrReport();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=br_report_" + id + ".pdf")
                .body(brReport);
    }

}