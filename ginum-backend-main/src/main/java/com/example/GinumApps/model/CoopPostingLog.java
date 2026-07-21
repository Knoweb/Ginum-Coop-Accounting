package com.example.GinumApps.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "coop_posting_log", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"source_system", "reference_type", "reference_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoopPostingLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "source_system", nullable = false)
    private String sourceSystem;

    @Column(name = "reference_type", nullable = false)
    private String referenceType;

    @Column(name = "reference_id", nullable = false)
    private String referenceId;

    @Column(name = "company_code", nullable = false)
    private String companyCode;

    @Column(name = "posting_date", nullable = false)
    private LocalDate postingDate;

    @Column(name = "description")
    private String description;

    @Column(name = "debit_total", precision = 19, scale = 2)
    private BigDecimal debitTotal;

    @Column(name = "credit_total", precision = 19, scale = 2)
    private BigDecimal creditTotal;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @Column(name = "journal_entry_id")
    private Long journalEntryId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
