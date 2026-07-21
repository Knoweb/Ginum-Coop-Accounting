package com.example.GinumApps.model;

import com.example.GinumApps.enums.ItemType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "item")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long itemId;

    private String itemCode;

    @Column(nullable = false)
    private String name;

    private String category;

    @Enumerated(EnumType.STRING)
    private ItemType itemType;

    private String description;

    @DecimalMin(value = "0.00")
    @Column(precision = 19, scale = 2)
    private BigDecimal purchasePrice = BigDecimal.ZERO;

    @DecimalMin(value = "0.01")
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal unitPrice;

    @DecimalMin(value = "0.00")
    @Column(precision = 19, scale = 2)
    private BigDecimal currentStock = BigDecimal.ZERO;

    @Min(value = 0)
    @Column
    private Integer reorderLevel = 0;

    @Column(length = 20)
    private String unit;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private Boolean active = true;

    @ManyToOne
    @JoinColumn(name = "company_id", nullable = false)
    @JsonIgnore
    private Company company;
}