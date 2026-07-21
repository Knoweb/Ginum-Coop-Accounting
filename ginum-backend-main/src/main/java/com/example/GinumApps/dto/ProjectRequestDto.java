package com.example.GinumApps.dto;

import com.example.GinumApps.enums.WorkingStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProjectRequestDto {

    @NotBlank(message = "Project code is required")
    private String projectCode;

    @NotBlank(message = "Project name is required")
    private String projectName;

    @NotNull(message = "Customer is required")
    private Long customerId;

    @NotBlank(message = "Start date is required")
    private String startDate;

    @NotNull(message = "Working status is required")
    private WorkingStatus workingStatus;

    @NotBlank(message = "Priority is required")
    private String priority;

    private String description;
}