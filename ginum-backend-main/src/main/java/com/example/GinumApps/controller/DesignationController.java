package com.example.GinumApps.controller;

import com.example.GinumApps.dto.DesignationDto;
import com.example.GinumApps.service.DesignationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/{companyId}/designations")
@RequiredArgsConstructor
public class DesignationController {
    private final DesignationService designationService;

    @GetMapping
    public ResponseEntity<List<DesignationDto>> getDesignationsByCompanyId(@PathVariable Integer companyId) {
        return ResponseEntity.ok(designationService.getDesignationsByCompanyId(companyId));
    }

    @PostMapping
    public ResponseEntity<DesignationDto> createDesignation(
            @PathVariable Integer companyId,
            @RequestBody DesignationDto designationDto) {
        return ResponseEntity.ok(designationService.createDesignation(companyId, designationDto));
    }

    @PutMapping("/{designationId}")
    public ResponseEntity<DesignationDto> updateDesignation(
            @PathVariable Integer companyId,
            @PathVariable Integer designationId,
            @RequestBody DesignationDto designationDto) {
        return ResponseEntity.ok(designationService.updateDesignation(companyId, designationId, designationDto));
    }

    @PatchMapping("/{designationId}/active")
    public ResponseEntity<DesignationDto> updateDesignationActiveStatus(
            @PathVariable Integer companyId,
            @PathVariable Integer designationId,
            @RequestParam Boolean active) {
        return ResponseEntity.ok(designationService.updateDesignationActiveStatus(companyId, designationId, active));
    }

    @GetMapping("/active")
    public ResponseEntity<List<DesignationDto>> getActiveDesignationsByCompany(@PathVariable Integer companyId) {
        return ResponseEntity.ok(designationService.getActiveDesignationsByCompany(companyId));
    }

    @GetMapping("/by-department/{departmentCode}")
    public ResponseEntity<List<DesignationDto>> getDesignationsByDepartmentCode(
            @PathVariable Integer companyId,
            @PathVariable String departmentCode) {

        List<DesignationDto> designations = designationService.getDesignationsByDepartmentCode(companyId, departmentCode);
        if (designations == null) {
            return ResponseEntity.notFound().build();
        }
        if (designations.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(designations);
    }
}
