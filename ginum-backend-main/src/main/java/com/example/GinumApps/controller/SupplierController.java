package com.example.GinumApps.controller;

import com.example.GinumApps.dto.SupplierDto;
import com.example.GinumApps.dto.SupplierSummaryDto;
import com.example.GinumApps.dto.SupplierUpdateDto;
import com.example.GinumApps.service.SupplierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/suppliers")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    @PostMapping(value = "/{companyId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> createSupplier(
            @PathVariable Integer companyId,
            @RequestPart("supplier") @Valid SupplierDto supplierDto,
            @RequestPart(value = "file", required = false) MultipartFile file
    ) throws IOException {

        if (file != null && !file.isEmpty()) {
            supplierDto.setBusinessRegistration(file);
        }

        supplierService.createSupplier(supplierDto, companyId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Supplier created successfully");

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/companies/{companyId}")
    public ResponseEntity<List<SupplierSummaryDto>> getSuppliersByCompany(
            @PathVariable Integer companyId
    ) {
        List<SupplierSummaryDto> suppliers =
                supplierService.getSuppliersByCompanyId(companyId);

        return ResponseEntity.ok(suppliers);
    }

    @GetMapping("/companies/{companyId}/active")
    public ResponseEntity<List<SupplierSummaryDto>> getActiveSuppliersByCompany(
            @PathVariable Integer companyId
    ) {
        List<SupplierSummaryDto> suppliers =
                supplierService.getActiveSuppliersByCompanyId(companyId);

        return ResponseEntity.ok(suppliers);
    }

    @PutMapping("/{supplierId}")
    public ResponseEntity<SupplierSummaryDto> updateSupplier(
            @PathVariable Long supplierId,
            @Valid @RequestBody SupplierUpdateDto request
    ) {
        SupplierSummaryDto response =
                supplierService.updateSupplier(supplierId, request);

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{supplierId}/active")
    public ResponseEntity<SupplierSummaryDto> updateSupplierActiveStatus(
            @PathVariable Long supplierId,
            @RequestParam Boolean active
    ) {
        SupplierSummaryDto response =
                supplierService.updateSupplierActiveStatus(supplierId, active);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{supplierId}")
    public ResponseEntity<Map<String, String>> deleteSupplier(
            @PathVariable Long supplierId
    ) {
        supplierService.deleteSupplierIfNoTransactions(supplierId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Supplier deleted successfully");

        return ResponseEntity.ok(response);
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalStateException(
            IllegalStateException ex
    ) {
        Map<String, String> response = new HashMap<>();
        response.put("message", ex.getMessage());

        return ResponseEntity.badRequest().body(response);
    }
}