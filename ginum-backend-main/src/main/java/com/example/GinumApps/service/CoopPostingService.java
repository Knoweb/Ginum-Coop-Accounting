package com.example.GinumApps.service;

import com.example.GinumApps.dto.CoopPostingPayload;
import com.example.GinumApps.enums.JournalEntryType;
import com.example.GinumApps.model.Account;
import com.example.GinumApps.model.Company;
import com.example.GinumApps.model.CoopPostingLog;
import com.example.GinumApps.model.JournalEntry;
import com.example.GinumApps.model.JournalEntryLine;
import com.example.GinumApps.repository.AccountRepository;
import com.example.GinumApps.repository.CompanyRepository;
import com.example.GinumApps.repository.CoopPostingLogRepository;
import com.example.GinumApps.repository.JournalEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CoopPostingService {

    private final CoopPostingLogRepository postingLogRepository;
    private final CompanyRepository companyRepository;
    private final AccountRepository accountRepository;
    private final JournalEntryRepository journalEntryRepository;

    @Transactional
    public void processPosting(CoopPostingPayload payload) {
        // Validation
        if (!"COOP".equals(payload.getSourceSystem())) {
            throw new IllegalArgumentException("Invalid source system");
        }

        Optional<CoopPostingLog> existing = postingLogRepository.findBySourceSystemAndReferenceTypeAndReferenceId(
                payload.getSourceSystem(), payload.getReferenceType(), payload.getReferenceId()
        );

        if (existing.isPresent() && "POSTED".equals(existing.get().getStatus())) {
            throw new IllegalStateException("Duplicate posting request");
        }

        Company company = companyRepository.findByCompanyRegNo(payload.getCompanyCode())
                .orElseThrow(() -> new IllegalArgumentException("Company not found with code: " + payload.getCompanyCode()));

        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;

        for (CoopPostingPayload.PostingLine line : payload.getLines()) {
            if (line.getDebit().compareTo(BigDecimal.ZERO) > 0 && line.getCredit().compareTo(BigDecimal.ZERO) > 0) {
                throw new IllegalArgumentException("Line cannot have both debit and credit");
            }
            if (line.getDebit().compareTo(BigDecimal.ZERO) == 0 && line.getCredit().compareTo(BigDecimal.ZERO) == 0) {
                throw new IllegalArgumentException("Line must have debit or credit");
            }
            totalDebit = totalDebit.add(line.getDebit());
            totalCredit = totalCredit.add(line.getCredit());
            
            // Check account
            accountRepository.findByAccountCodeAndCompany_CompanyId(line.getAccountCode(), company.getCompanyId())
                    .orElseThrow(() -> new IllegalArgumentException("Account code not found: " + line.getAccountCode()));
        }

        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new IllegalArgumentException("Journal entry is unbalanced. Total Debit: " + totalDebit + ", Total Credit: " + totalCredit);
        }

        // Create Journal Entry
        JournalEntry entry = new JournalEntry();
        entry.setEntryType(JournalEntryType.SYSTEM_GENERATED);
        entry.setEntryDate(payload.getPostingDate());
        entry.setJournalTitle(payload.getDescription());
        entry.setReferenceNo(payload.getReferenceType() + "-" + payload.getReferenceId());
        entry.setCompany(company);
        entry.setDescription(payload.getDescription());

        List<JournalEntryLine> entryLines = new ArrayList<>();
        for (CoopPostingPayload.PostingLine pl : payload.getLines()) {
            Account account = accountRepository.findByAccountCodeAndCompany_CompanyId(pl.getAccountCode(), company.getCompanyId()).get();
            
            JournalEntryLine jl = new JournalEntryLine();
            jl.setJournalEntry(entry);
            jl.setAccount(account);
            jl.setDescription(pl.getNarration());
            
            if (pl.getDebit().compareTo(BigDecimal.ZERO) > 0) {
                jl.setAmount(pl.getDebit());
                jl.setDebit(true);
            } else {
                jl.setAmount(pl.getCredit());
                jl.setDebit(false);
            }
            entryLines.add(jl);
        }
        
        entry.setJournalEntryLines(entryLines);
        JournalEntry savedEntry = journalEntryRepository.save(entry);

        CoopPostingLog log = existing.orElse(new CoopPostingLog());
        log.setSourceSystem(payload.getSourceSystem());
        log.setReferenceType(payload.getReferenceType());
        log.setReferenceId(payload.getReferenceId());
        log.setCompanyCode(payload.getCompanyCode());
        log.setPostingDate(payload.getPostingDate());
        log.setDescription(payload.getDescription());
        log.setDebitTotal(totalDebit);
        log.setCreditTotal(totalCredit);
        log.setStatus("POSTED");
        log.setJournalEntryId(savedEntry.getId());
        
        postingLogRepository.save(log);
    }
}
