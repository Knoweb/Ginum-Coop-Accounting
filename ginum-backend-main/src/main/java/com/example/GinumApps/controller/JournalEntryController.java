package com.example.GinumApps.controller;

import com.example.GinumApps.dto.JournalEntryDto;
import com.example.GinumApps.model.JournalEntry;
import com.example.GinumApps.service.JournalEntryService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/companies/{companyId}/journal-entries")
@RequiredArgsConstructor
public class JournalEntryController {

    private final JournalEntryService journalEntryService;

    @PostMapping
    public ResponseEntity<?> createJournalEntry(
            @PathVariable Integer companyId,
            @Valid @RequestBody JournalEntryDto dto) {
        try {
            dto.setCompanyId(companyId);
            JournalEntry created = journalEntryService.createJournalEntry(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (JournalEntryService.InvalidJournalEntryException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (EntityNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", ex.getMessage()));
        }
    }
}