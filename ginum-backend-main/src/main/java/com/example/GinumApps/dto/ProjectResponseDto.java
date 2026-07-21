package com.example.GinumApps.dto;

import com.example.GinumApps.enums.WorkingStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProjectResponseDto {
    private Long id;
    private String code;
    private String name;
    private String startDate;
    private String description;
    private String priority;
    private WorkingStatus workingStatus;
    private Long customerId;
    private String customerName;
    private Integer companyId;
    private Long totalCost;
}