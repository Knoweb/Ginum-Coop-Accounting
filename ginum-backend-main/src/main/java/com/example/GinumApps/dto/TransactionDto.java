package com.example.GinumApps.dto;

import lombok.Data;
import java.util.List;

@Data
public class TransactionDto {
    private String referenceNumber;
    private String date;
    private String description;
    private List<EntryDto> entries;
    private double totalDebit;
    private double totalCredit;
}