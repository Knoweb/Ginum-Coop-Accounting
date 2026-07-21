package com.example.GinumApps.model;

import com.example.GinumApps.enums.JournalEntryType;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "journal_entries")
@Data
public class JournalEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private JournalEntryType entryType;

    @Column(nullable = false)
    private LocalDate entryDate;

    @Column(nullable = false)
    private String journalTitle;

    @Column(nullable = false)
    private String referenceNo;

    private Integer authorId;

    private String description;

    @ManyToOne
    @JoinColumn(name = "company_id", nullable = false)
    @JsonBackReference
    private Company company;

    @OneToMany(mappedBy = "journalEntry", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @JsonIgnore
    private List<JournalEntryLine> journalEntryLines = new ArrayList<>();
}
