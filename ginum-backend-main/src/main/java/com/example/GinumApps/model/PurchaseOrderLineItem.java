package com.example.GinumApps.model;

import com.example.GinumApps.enums.LineItemType;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.Data;
import lombok.ToString;

import java.math.BigDecimal;

@Entity
@Table(name = "purchase_order_line_items")
@Data
public class PurchaseOrderLineItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long lineItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_id", nullable = false)
    @JsonBackReference("po-line-items")
    @ToString.Exclude
    private PurchaseOrder purchaseOrder;

    // GOODS only. SERVICES can be null.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    @ToString.Exclude
    private Item item;

    private String description;

    private Integer quantity;

    @DecimalMin("0.01")
    @Column(precision = 19, scale = 2)
    private BigDecimal unitPrice;

    @DecimalMin("0.00")
    @DecimalMax("100.00")
    @Column(precision = 19, scale = 2)
    private BigDecimal discountPercent = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne
    @JoinColumn(name = "account_id")
    private Account account;

    @DecimalMin("0.00")
    @Column(precision = 19, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    private LineItemType itemType;
}