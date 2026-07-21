// Company.java
package com.example.GinumApps.model;

import com.example.GinumApps.enums.CompanyCategory;
import com.example.GinumApps.repository.AccountRepository;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Getter
@Setter
@ToString(onlyExplicitlyIncluded = true)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "company_tbl")
public class Company {
    // Default account codes (final for immutability)
    public static final String FREIGHT_ACCOUNT_CODE = "5100";
    public static final String TAX_ACCOUNT_CODE = "5200";
    public static final String PAYABLE_ACCOUNT_CODE = "2100";
    public static final String RECEIVABLE_ACCOUNT_CODE = "1100";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "company_id")
    @EqualsAndHashCode.Include
    private Integer companyId;

    @Column(nullable = false, length = 30)
    private String companyName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CompanyCategory companyCategory;

    @Column(length = 20)
    private String companyRegNo;

    @Column(nullable = false)
    private Boolean isVatRegistered;

    @Column(length = 10)
    private String vatNo;

    @Column(length = 10)
    private String tinNo;

    @Column(nullable = false, length = 200)
    private String companyRegisteredAddress;

    @Column(length = 200)
    private String companyFactoryAddress;

    @Column(length = 15)
    private String phoneNo;

    @Column(length = 15)
    private String mobileNo;

    @Column(nullable = false, length = 30)
    private String email;

    @Column(length = 50)
    private String websiteUrl;

    private LocalDate dateJoined;

    @Column(nullable = false, length = 255)
    private String password;

    @Lob
    @Column(name = "company_logo")
    private byte[] companyLogo;

    @Lob
    @Column(name = "br_report")
    private byte[] brReport;

    @ManyToOne
    @JoinColumn(name = "country_id", nullable = false)
    @JsonBackReference
    private Country country;

    @ManyToOne
    @JoinColumn(name = "currency_id", nullable = false)
    @JsonBackReference
    private Currency currency;

    @Column(nullable = false)
    private Boolean status;

    private Date subscriptionExpiryDate;

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL)
    private List<Employee> employees = new ArrayList<>();

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL)
    private List<AppUser> users = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "package_id", nullable = false)
    @JsonBackReference
    private SubscriptionPackage packageEntity;

    @Column(nullable = false)
    private String role = "COMPANY";

    @ManyToOne
    @JoinColumn(name = "freight_account_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private Account freightAccount;

    @ManyToOne
    @JoinColumn(name = "tax_account_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private Account taxAccount;

    @ManyToOne
    @JoinColumn(name = "accounts_payable_account_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private Account accountsPayableAccount;

    @ManyToOne
    @JoinColumn(name = "accounts_receivable_account_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private Account accountsReceivableAccount;

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Account> accounts;

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Item> items;

//    public Account getFreightAccount() {
//        if(freightAccount == null) {
//            freightAccount = accountRepository.findByAccountCodeAndCompany_CompanyId(
//                    "5100", this.companyId
//            ).orElseThrow();
//        }
//        return freightAccount;
//    }
}