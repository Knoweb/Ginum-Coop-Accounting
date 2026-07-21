package com.example.GinumApps.model;

import com.example.GinumApps.enums.SalesType;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import lombok.Data;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "sales_orders",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"company_id", "so_number"}
        )
)
@Data
public class SalesOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    @JsonManagedReference("customer-sales-orders")
    private Customer customer;

    @Column(name = "so_number", nullable = false)
    private String soNumber;

    @ManyToOne
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    private LocalDate issueDate;

    private LocalDate dueDate;

    private String notes;

    @DecimalMin("0.00")
    @Column(precision = 19, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

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

    @OneToMany(mappedBy = "salesOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("so-line-items")
    private List<SalesOrderLineItem> items = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private SalesType salesType;

    @PrePersist
    @PreUpdate
    private void calculateTotals() {
        this.subtotal = items.stream()
                .map(item -> {
                    BigDecimal unitPrice = item.getUnitPrice() != null
                            ? item.getUnitPrice()
                            : BigDecimal.ZERO;

                    int quantity = item.getQuantity() != null
                            ? item.getQuantity()
                            : 1;

                    BigDecimal discount = item.getDiscountPercent() != null
                            ? item.getDiscountPercent()
                            : BigDecimal.ZERO;

                    return unitPrice
                            .multiply(BigDecimal.valueOf(quantity))
                            .multiply(BigDecimal.ONE.subtract(
                                    discount.divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                            ));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        this.total = this.subtotal;

        BigDecimal paid = amountPaid != null ? amountPaid : BigDecimal.ZERO;
        this.balanceDue = this.total.subtract(paid);

        if (balanceDue.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalStateException("Overpayment detected");
        }
    }
}