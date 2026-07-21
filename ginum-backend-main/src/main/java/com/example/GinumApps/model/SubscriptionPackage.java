package com.example.GinumApps.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Data
@Entity
@Table(name = "subscription_package")
public class SubscriptionPackage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "subscription_package_id")
    private Integer id;

    @Column(name = "subscription_package_name", nullable = false, length = 20)
    private String packageName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // Optional: If you want bidirectional mapping
    @OneToMany(mappedBy = "packageEntity", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<Company> companies;
}