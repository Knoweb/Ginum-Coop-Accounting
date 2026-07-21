package com.example.GinumApps.model;

import com.example.GinumApps.enums.ItemCategory;
import com.example.GinumApps.enums.SupplierType;
import com.example.GinumApps.enums.TaxType;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@RequiredArgsConstructor
@Entity
public class Supplier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String supplierName;

    @Email
    private String email;

    private String mobileNo;

    @Column(nullable = false)
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SupplierType supplierType;

    private String tinNo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaxType tax;

    @ManyToOne
    @JoinColumn(name = "currency_id", nullable = false)
    private Currency currency;

    @Lob
    private byte[] businessRegistration;

    private ItemCategory itemCategory;

    private String swiftNo;

    private Double discountPercentage;

    @Column(nullable = false)
    private Boolean active = true;

    @ManyToOne
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @OneToMany(mappedBy = "supplier")
    @JsonBackReference( "supplier-purchase-orders")
    @JsonIgnore
    private List<PurchaseOrder> purchaseOrders = new ArrayList<>();
}
