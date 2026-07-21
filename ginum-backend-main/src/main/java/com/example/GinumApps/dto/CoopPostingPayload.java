package com.example.GinumApps.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class CoopPostingPayload {
    private String sourceSystem;
    private String referenceType;
    private String referenceId;
    private String companyCode;
    private LocalDate postingDate;
    private String description;
    private List<PostingLine> lines;

    @Data
    public static class PostingLine {
        private String accountCode;
        private BigDecimal debit;
        private BigDecimal credit;
        private String narration;
    }
}
