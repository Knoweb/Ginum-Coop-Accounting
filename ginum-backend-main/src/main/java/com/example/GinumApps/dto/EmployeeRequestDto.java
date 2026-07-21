package com.example.GinumApps.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalDate;

@Data
public class EmployeeRequestDto {
    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Gender is required")
    private String gender;

    @NotNull(message = "Department is required ")
    private Integer departmentId;

    @NotNull(message = "Designation ID is required")
    private Integer designationId;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^\\+?\\d{10,12}$", message = "Invalid mobile number")
    private String mobileNo;

    private LocalDate dob;

    @NotBlank(message = "NIC is required")
    private String nic;

    private String epfNo;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

//    @NotNull(message = "Company ID is required")
//    private Integer companyId;

    @NotNull(message = "Date added is required")
//    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-dd-MM")
    private LocalDate dateAdded;
}
