package com.example.GinumApps.controller;

import com.example.GinumApps.dto.BankAccountRequestDto;
import com.example.GinumApps.dto.BankAccountResponseDto;
import com.example.GinumApps.model.BankAccount;
import com.example.GinumApps.service.BankAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/companies/{companyId}/bank-accounts")
@RequiredArgsConstructor
public class BankAccountController {

    private final BankAccountService bankAccountService;

    @PostMapping
    public ResponseEntity<?> createBankAccount(
            @PathVariable Integer companyId,
            @Valid @RequestBody BankAccountRequestDto request
    ) {
        try {
            BankAccount createdAccount = bankAccountService.createBankAccount(companyId ,request);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdAccount);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<BankAccountResponseDto>> getBankAccountsByCompany(
            @PathVariable Integer companyId) {
        List<BankAccountResponseDto> accounts = bankAccountService.getBankAccountsByCompany(companyId);
        return ResponseEntity.ok(accounts);
    }
}