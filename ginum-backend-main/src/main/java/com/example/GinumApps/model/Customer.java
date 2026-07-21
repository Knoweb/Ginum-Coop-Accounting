package com.example.GinumApps.model;

import com.example.GinumApps.enums.CustomerType;
import com.example.GinumApps.enums.TaxType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Entity
@Data
@RequiredArgsConstructor
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "phone_no", nullable = false)
    private String phoneNo;

    private String email;

    private String nicNo;

    @Enumerated(EnumType.STRING)
    @Column(name = "customer_type", nullable = false)
    private CustomerType customerType;

    private String vat;

    private String tinNo;

    @Column(name = "delivery_address", nullable = false)
    private String deliveryAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaxType tax;

    @Column(name = "billing_address", nullable = false)
    private String billingAddress;

    private String swiftNo;

    @ManyToOne
    @JoinColumn(name = "currency_id")
    private Currency currency;

    private Double discountPercentage;

    @Lob
    @Column(name = "business_registration")
    private byte[] businessRegistration;

    @ManyToOne
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;
}
