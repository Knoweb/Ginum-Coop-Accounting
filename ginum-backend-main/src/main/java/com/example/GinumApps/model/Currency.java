package com.example.GinumApps.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Data
@Entity
@Table(name = "currency_tbl")
public class Currency {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 10, unique = true)
    private String code; // Example: USD, EUR, GBP

    @Column(nullable = false, length = 50)
    private String name; // Example: US Dollar, Euro, British Pound

    @Column(length = 10)
    private String symbol; // Example: $, €, £

    @OneToMany(mappedBy = "currency", cascade = CascadeType.ALL)
    @JsonManagedReference
    @JsonIgnore
    private List<Company> companies;
}

