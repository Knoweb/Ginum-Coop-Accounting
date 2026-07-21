package com.example.GinumApps.dto;

import lombok.Data;

@Data
public class UserProfileDto {
    private String email;
    private String name;
    private String phone;
    private String address;
    private String role;
    private String status;
    private String joinedDate;
    private String companyName;
    private String designation;
    private String department;
}
