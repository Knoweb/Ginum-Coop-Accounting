package com.example.GinumApps.dto;

import com.example.GinumApps.enums.RequestPriority;
import com.example.GinumApps.enums.RequestStatus;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CompanyRequestDto {
    private Long id;
    private String requestType;
    private String title;
    private String description;
    private RequestPriority priority;
    private RequestStatus status;
    private String requestedBy;
    private LocalDate requestedDate;
    private String approvedBy;
    private LocalDate approvedDate;
    private String rejectedBy;
    private LocalDate rejectedDate;
    private String rejectReason;
}
