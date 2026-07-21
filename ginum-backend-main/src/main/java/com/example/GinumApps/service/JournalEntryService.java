package com.example.GinumApps.service;

import com.example.GinumApps.dto.JournalEntryDto;
import com.example.GinumApps.dto.JournalEntryLineDto;
import com.example.GinumApps.enums.AccountType;
import com.example.GinumApps.model.Account;
import com.example.GinumApps.model.Company;
import com.example.GinumApps.model.JournalEntry;
import com.example.GinumApps.model.JournalEntryLine;
import com.example.GinumApps.repository.AccountRepository;
import com.example.GinumApps.repository.CompanyRepository;
import com.example.GinumApps.repository.JournalEntryRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JournalEntryService {

    private final JournalEntryRepository journalEntryRepo;
    private final AccountRepository accountRepo;
    private final CompanyRepository companyRepo;

    @Transactional
    public JournalEntry createJournalEntry(JournalEntryDto dto) {
        // Validate basic requirements
        validateJournalEntry(dto);

        // Get company
        Company company = companyRepo.findById(dto.getCompanyId())
                .orElseThrow(() -> new EntityNotFoundException("Company not found"));

        // Create journal entry
        JournalEntry entry = new JournalEntry();
        entry.setEntryType(dto.getEntryType());
        entry.setEntryDate(dto.getEntryDate());
        entry.setJournalTitle(dto.getJournalTitle());
        entry.setReferenceNo(dto.getReferenceNo());
        entry.setAuthorId(dto.getAuthorId());
        entry.setDescription(dto.getDescription());
        entry.setCompany(company);

        // Process journal lines
        List<JournalEntryLine> lines = processJournalLines(dto.getLines(), entry, company);
        entry.setJournalEntryLines(lines);

        // Save entry
        return journalEntryRepo.save(entry);
    }

    private void validateJournalEntry(JournalEntryDto dto) {
        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;

        for (JournalEntryLineDto line : dto.getLines()) {
            System.out.println("Account code: " + line.getAccountCode() + " | Amount: " + line.getAmount() + " | Is Debit: " + line.isDebit());

            if (line.isDebit()) {
                totalDebit = totalDebit.add(line.getAmount());
            } else {
                totalCredit = totalCredit.add(line.getAmount());
            }
        }

        System.out.println("Final Debit: " + totalDebit + " | Final Credit: " + totalCredit);

        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new InvalidJournalEntryException(
                    "Debit and Credit totals must be equal. Debit: " + totalDebit + " Credit: " + totalCredit
            );
        }
    }

    private List<JournalEntryLine> processJournalLines(List<JournalEntryLineDto> lineDtos,
                                                       JournalEntry entry,
                                                       Company company) {
        return lineDtos.stream().map(lineDto -> {
            // Get account by code + company
            Account account = accountRepo.findByAccountCodeAndCompany_CompanyId(
                    lineDto.getAccountCode(),
                    company.getCompanyId()
            ).orElseThrow(() -> new EntityNotFoundException(
                    "Account not found with code: " + lineDto.getAccountCode() +
                            " for company " + company.getCompanyId()
            ));

            // Calculate balance change
            BigDecimal balanceChange = calculateBalanceChange(
                    account.getAccountType(),
                    lineDto.isDebit(),
                    lineDto.getAmount()
            );

            // Update account balance
            updateAccountBalance(account, balanceChange);

            // Create journal line
            JournalEntryLine line = new JournalEntryLine();
            line.setJournalEntry(entry);
            line.setAccount(account);
            line.setAmount(lineDto.getAmount());
            line.setDebit(lineDto.isDebit());
            line.setDescription(lineDto.getDescription());

            return line;
        }).collect(Collectors.toList());
    }

    private BigDecimal calculateBalanceChange(AccountType accountType, boolean isDebit, BigDecimal amount) {
        boolean isDebitNormal = accountType.isDebitType();

        if (isDebitNormal) {
            return isDebit ? amount : amount.negate();
        } else {
            return isDebit ? amount.negate() : amount;
        }
    }

    private void updateAccountBalance(Account account, BigDecimal amount) {
        BigDecimal current = account.getCurrentBalance() == null ? BigDecimal.ZERO : account.getCurrentBalance();
        BigDecimal newBalance = current.add(amount);

        if (newBalance.compareTo(BigDecimal.ZERO) < 0 &&
                !account.getAccountType().getMainCategory().equals("Liability")) {
            throw new InvalidJournalEntryException(
                    "Account " + account.getAccountName() + " cannot have negative balance"
            );
        }

        account.setCurrentBalance(newBalance);
        accountRepo.save(account);
    }

    // Custom exception
    public static class InvalidJournalEntryException extends RuntimeException {
        public InvalidJournalEntryException(String message) {
            super(message);
        }
    }
}
