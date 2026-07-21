package com.example.GinumApps.controller;

import com.example.GinumApps.dto.CompanyRegistrationDto;
import com.example.GinumApps.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
@CrossOrigin // Frontend එකෙන් එන requests වලට ඉඩ දෙන්න
public class CompanyController {

    private final CompanyService companyService; // ඔබේ Service එක මෙතනට සම්බන්ධ කිරීම

    @PostMapping(value = "/register", consumes = "multipart/form-data")
    public ResponseEntity<?> registerCompany(@ModelAttribute @Valid CompanyRegistrationDto dto) {
        try {
            // Service එක හරහා Database එකට Save කිරීම
            companyService.registerCompany(dto);

            return ResponseEntity.ok().body("{\"message\": \"Company registered successfully!\"}");
        } catch (RuntimeException e) {
            // Duplicate email හෝ වෙනත් error එකක් ආවොත්
            return ResponseEntity.badRequest().body("{\"message\": \"" + e.getMessage() + "\"}");
        } catch (Exception e) {
            // System error එකක් ආවොත්
            return ResponseEntity.internalServerError().body("{\"message\": \"Registration failed: " + e.getMessage() + "\"}");
        }
    }
}