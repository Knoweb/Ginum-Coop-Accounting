package com.example.GinumApps.model;

import com.example.GinumApps.enums.PurchaseType;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "purchase_orders",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"company_id", "po_number"}
        )
)
@Data
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "supplier_id", nullable = false)
    @JsonManagedReference("supplier-purchase-orders")
    private Supplier supplier;

    @Column(name = "po_number", nullable = false)
    private String poNumber;

    @ManyToOne
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    private String supplierInvoiceNumber;

    private LocalDate issueDate;

    private LocalDate dueDate;

    private LocalDate promiseDate;

    private String notes;

    @DecimalMin("0.00")
    @Column(precision = 19, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @DecimalMin("0.00")
    @Column(precision = 19, scale = 2)
    private BigDecimal freight = BigDecimal.ZERO;

    @DecimalMin("0.00")
    @Column(precision = 19, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @DecimalMin("0.00")
    @Column(precision = 19, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

    @ManyToOne
    @JoinColumn(name = "payment_account_id")
    private Account paymentAccount;

    @DecimalMin("0.00")
    @Column(precision = 19, scale = 2)
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @DecimalMin("0.00")
    @Column(precision = 19, scale = 2)
    private BigDecimal balanceDue = BigDecimal.ZERO;

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("po-line-items")
    private List<PurchaseOrderLineItem> items = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private PurchaseType purchaseType;

    @PrePersist
    @PreUpdate
    private void calculateTotals() {
        this.subtotal = items.stream()
                .map(item -> item.getAmount() != null ? item.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal safeFreight = freight != null ? freight : BigDecimal.ZERO;
        BigDecimal safeTax = taxAmount != null ? taxAmount : BigDecimal.ZERO;
        BigDecimal safePaid = amountPaid != null ? amountPaid : BigDecimal.ZERO;

        this.total = subtotal.add(safeFreight).add(safeTax);
        this.balanceDue = total.subtract(safePaid);

        if (this.balanceDue.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalStateException("Overpayment detected");
        }
    }
}