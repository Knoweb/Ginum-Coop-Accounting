package com.example.GinumApps.dto;

import com.example.GinumApps.enums.JournalEntryType;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class JournalEntryDto {
    private JournalEntryType entryType;
    private LocalDate entryDate;
    private String journalTitle;
    private String referenceNo;
    private Integer authorId;
    private String description;
    private Integer companyId;

    private List<JournalEntryLineDto> lines;

}

