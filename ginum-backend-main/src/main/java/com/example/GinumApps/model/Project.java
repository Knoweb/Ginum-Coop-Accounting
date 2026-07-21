package com.example.GinumApps.model;

import com.example.GinumApps.enums.WorkingStatus;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "projects")
@Data
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code;

    private String name;

    private String startDate;

    private String description;

    private String priority;

    @Enumerated(EnumType.STRING)
    private WorkingStatus workingStatus;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    private Long totalCost;
}