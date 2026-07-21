package com.example.GinumApps.controller;

import com.example.GinumApps.dto.DepartmentDto;
import com.example.GinumApps.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/{companyId}/departments")
@RequiredArgsConstructor
public class DepartmentController {
    private final DepartmentService departmentService;

    @PostMapping
    public ResponseEntity<DepartmentDto> createDepartment(@PathVariable Integer companyId, @RequestBody DepartmentDto departmentDto) {
        return ResponseEntity.ok(departmentService.createDepartment(companyId, departmentDto));
    }

    @GetMapping
    public ResponseEntity<List<DepartmentDto>> getDepartmentsByCompanyId(@PathVariable Integer companyId) {
        return ResponseEntity.ok(departmentService.getDepartmentsByCompanyId(companyId));
    }

    @PutMapping("/{departmentId}")
    public ResponseEntity<DepartmentDto> updateDepartment(
            @PathVariable Integer companyId,
            @PathVariable Integer departmentId,
            @RequestBody DepartmentDto departmentDto) {
        return ResponseEntity.ok(departmentService.updateDepartment(companyId, departmentId, departmentDto));
    }

    @PatchMapping("/{departmentId}/active")
    public ResponseEntity<DepartmentDto> updateDepartmentActiveStatus(
            @PathVariable Integer companyId,
            @PathVariable Integer departmentId,
            @RequestParam Boolean active) {
        return ResponseEntity.ok(departmentService.updateDepartmentActiveStatus(companyId, departmentId, active));
    }

    @GetMapping("/active")
    public ResponseEntity<List<DepartmentDto>> getActiveDepartmentsByCompany(@PathVariable Integer companyId) {
        return ResponseEntity.ok(departmentService.getActiveDepartmentsByCompany(companyId));
    }
}