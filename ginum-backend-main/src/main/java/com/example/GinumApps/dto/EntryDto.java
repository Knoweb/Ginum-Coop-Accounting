package com.example.GinumApps.dto;

import lombok.Data;

@Data
public class EntryDto {
    private Integer account;
    private Double debit;
    private Double credit;
    private Double quantity;
    private String description;
    private Integer project;
}