package com.example.GinumApps.model;

import com.example.GinumApps.enums.RequestPriority;
import com.example.GinumApps.enums.RequestStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@Entity
@Table(name = "company_requests")
public class CompanyRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String requestType;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status = RequestStatus.PENDING;

    @Column(nullable = false)
    private String requestedBy;

    private LocalDate requestedDate;

    private String approvedBy;
    private LocalDate approvedDate;

    private String rejectedBy;
    private LocalDate rejectedDate;
    private String rejectReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    @JsonIgnore
    private Company company;
    
    @PrePersist
    public void prePersist() {
        if (this.requestedDate == null) {
            this.requestedDate = LocalDate.now();
        }
        if (this.status == null) {
            this.status = RequestStatus.PENDING;
        }
    }
}
