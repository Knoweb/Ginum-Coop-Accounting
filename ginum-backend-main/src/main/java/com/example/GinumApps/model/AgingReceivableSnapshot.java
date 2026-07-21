package com.example.GinumApps.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "aging_receivables")
@Data
public class AgingReceivableSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(nullable = false)
    private String soNumber;

    @Column(nullable = false)
    private LocalDate dueDate;

    @Column(nullable = false)
    private BigDecimal balanceDue;

    @Column(nullable = false)
    private LocalDate snapshotDate;

    private BigDecimal bucket0to30 = BigDecimal.ZERO;
    private BigDecimal bucket31to60 = BigDecimal.ZERO;
    private BigDecimal bucket61to90 = BigDecimal.ZERO;
    private BigDecimal bucket91plus = BigDecimal.ZERO;

    public void computeBuckets(LocalDate today) {
        long days = java.time.temporal.ChronoUnit.DAYS.between(dueDate, today);

        if (days <= 30) bucket0to30 = balanceDue;
        else if (days <= 60) bucket31to60 = balanceDue;
        else if (days <= 90) bucket61to90 = balanceDue;
        else bucket91plus = balanceDue;
    }
}

