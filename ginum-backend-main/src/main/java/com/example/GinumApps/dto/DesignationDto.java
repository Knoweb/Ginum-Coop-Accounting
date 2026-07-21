package com.example.GinumApps.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DesignationDto {
    private Integer id;
    private String name;
    private String departmentCode;
    private String departmentName;
    private Boolean active;
}
