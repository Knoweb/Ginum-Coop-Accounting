package com.example.GinumApps.controller;

import com.example.GinumApps.dto.AccountEditRequestDto;
import com.example.GinumApps.dto.AccountRequestDto;
import com.example.GinumApps.dto.AccountResponseDto;
import com.example.GinumApps.model.Account;
import com.example.GinumApps.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/companies/{companyId}/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @PostMapping
    public ResponseEntity<?> createAccount(
            @PathVariable Integer companyId,
            @Valid @RequestBody AccountRequestDto request
    ) {
        try {
//            request.setCompanyId(companyId);
            Account createdAccount = accountService.createAccount(companyId,request);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdAccount);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<AccountResponseDto>> getAccountsByCompany(
            @PathVariable Integer companyId) {
        List<AccountResponseDto> accounts = accountService.getAccountsByCompany(companyId);
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/active")
    public ResponseEntity<List<AccountResponseDto>> getActiveAccountsByCompany(
            @PathVariable Integer companyId) {
        List<AccountResponseDto> accounts = accountService.getActiveAccountsByCompany(companyId);
        return ResponseEntity.ok(accounts);
    }

    @PutMapping("/{accountId}")
    public ResponseEntity<?> updateAccount(
            @PathVariable Integer companyId,
            @PathVariable Long accountId,
            @Valid @RequestBody AccountEditRequestDto request) {
        try {
            AccountResponseDto updatedAccount = accountService.updateAccount(companyId, accountId, request);
            return ResponseEntity.ok(updatedAccount);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", ex.getMessage()));
        } catch (jakarta.persistence.EntityNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    @PatchMapping("/{accountId}/active")
    public ResponseEntity<?> toggleAccountActiveStatus(
            @PathVariable Integer companyId,
            @PathVariable Long accountId,
            @RequestParam boolean active) {
        try {
            AccountResponseDto updatedAccount = accountService.toggleAccountActiveStatus(companyId, accountId, active);
            return ResponseEntity.ok(updatedAccount);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", ex.getMessage()));
        } catch (jakarta.persistence.EntityNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

}
