package com.example.GinumApps.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "fixed_assets")
@Data
public class FixedAsset {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal purchaseCost;

    @Column(nullable = false)
    private LocalDate purchaseDate;

    @Column(nullable = false)
    private Integer usefulLife; // in years

    @Column(nullable = false)
    private String depreciationMethod; // e.g., "Straight Line"

    @ManyToOne
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;
}
