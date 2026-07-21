package com.example.GinumApps.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class AppUserRequestDto {
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 7, message = "Password must be at least 7 characters")
    private String password;

    @NotBlank(message = "Role is required")
    @Pattern(regexp = "USER|COMPANY", message = "Role must be USER or COMPANY")
    private String role;

//    @NotNull(message = "Company ID is required")
//    private Integer companyId;
}