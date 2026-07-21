package com.example.GinumApps.service;

import com.example.GinumApps.dto.BankAccountRequestDto;
import com.example.GinumApps.dto.BankAccountResponseDto;
import com.example.GinumApps.enums.AccountType;
import com.example.GinumApps.model.BankAccount;
import com.example.GinumApps.model.Company;
import com.example.GinumApps.repository.AccountRepository;
import com.example.GinumApps.repository.BankAccountRepository;
import com.example.GinumApps.repository.CompanyRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BankAccountService {

    private static final List<String> ASSET_RESERVED_CODES = List.of();

    private final BankAccountRepository bankAccountRepository;
    private final CompanyRepository companyRepository;
    private final AccountRepository accountRepository;

    @Transactional
    public BankAccount createBankAccount(Integer companyId,BankAccountRequestDto request) {
        if (bankAccountRepository.existsByAccountNumber(request.getAccountNumber())) {
            throw new RuntimeException("Account number already exists");
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found"));

        // Generate account code
        String accountCode = generateAssetAccountCode(company);

        BankAccount bankAccount = new BankAccount();
        bankAccount.setBankName(request.getBankName());
        bankAccount.setBranchName(request.getBranchName());
        bankAccount.setAccountNumber(request.getAccountNumber());
        bankAccount.setSubAccountName(request.getSubAccountName());
        bankAccount.setCurrentBalance(request.getCurrentBalance());
        bankAccount.setCompany(company);
        bankAccount.setAccountCode(accountCode);

        // Handle account name
        if (request.getAccountName() != null && !request.getAccountName().isBlank()) {
            bankAccount.setAccountName(request.getAccountName());
        } else {
            bankAccount.setBankName(request.getBankName()); // Auto-sets "Bank-{name}"
        }

        return bankAccountRepository.save(bankAccount);
    }

    private String generateAssetAccountCode(Company company) {
        List<AccountType> assetTypes = Arrays.stream(AccountType.values())
                .filter(t -> t.getMainCategory().equals("Asset"))
                .collect(Collectors.toList());

        long count = accountRepository.countByCompanyAndAccountTypes(
                company.getCompanyId(),
                assetTypes,
                ASSET_RESERVED_CODES
        );

        // Add validation for code range
        int nextCode = 1000 + (int) count + 1;
        if (nextCode > 9999) {
            throw new IllegalStateException("Asset account code overflow (max 9999)");
        }

        return String.format("%04d", nextCode);
    }

    public List<BankAccountResponseDto> getBankAccountsByCompany(Integer companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new EntityNotFoundException("Company not found"));

        return bankAccountRepository.findByCompany_CompanyId(companyId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private BankAccountResponseDto convertToDto(BankAccount account) {
        BankAccountResponseDto dto = new BankAccountResponseDto();
        dto.setId(account.getId());
        dto.setAccountName(account.getAccountName());
        dto.setAccountType(account.getAccountType());
        dto.setCurrentBalance(account.getCurrentBalance());
        dto.setAccountCode(account.getAccountCode());
        dto.setBankName(account.getBankName());
        dto.setBranchName(account.getBranchName());
        dto.setAccountNumber(account.getAccountNumber());
        return dto;
    }
}