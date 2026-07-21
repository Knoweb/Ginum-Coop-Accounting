package com.example.GinumApps.controller;

import com.example.GinumApps.dto.CompanyRequestDto;
import com.example.GinumApps.service.CompanyRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class CompanyRequestController {

    private final CompanyRequestService requestService;

    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<CompanyRequestDto>> getRequestsByCompany(@PathVariable Integer companyId) {
        return ResponseEntity.ok(requestService.getRequestsByCompany(companyId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompanyRequestDto> getRequestById(@PathVariable Long id) {
        return ResponseEntity.ok(requestService.getRequestById(id));
    }

    @PostMapping("/company/{companyId}")
    public ResponseEntity<CompanyRequestDto> createRequest(
            @PathVariable Integer companyId,
            @RequestBody CompanyRequestDto dto) {
        CompanyRequestDto created = requestService.createRequest(companyId, dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CompanyRequestDto> updateRequest(
            @PathVariable Long id,
            @RequestBody CompanyRequestDto dto) {
        return ResponseEntity.ok(requestService.updateRequest(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequest(@PathVariable Long id) {
        requestService.deleteRequest(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<CompanyRequestDto> approveRequest(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String approvedBy = payload.getOrDefault("approvedBy", "Admin");
        return ResponseEntity.ok(requestService.approveRequest(id, approvedBy));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<CompanyRequestDto> rejectRequest(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String rejectedBy = payload.getOrDefault("rejectedBy", "Admin");
        String reason = payload.getOrDefault("reason", "");
        return ResponseEntity.ok(requestService.rejectRequest(id, rejectedBy, reason));
    }
}
