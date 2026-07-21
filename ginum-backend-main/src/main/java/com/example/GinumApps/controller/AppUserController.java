package com.example.GinumApps.controller;

import com.example.GinumApps.dto.AppUserRequestDto;
import com.example.GinumApps.model.AppUser;
import com.example.GinumApps.service.AppUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users/{companyId}")
@RequiredArgsConstructor
public class AppUserController {

    private final AppUserService appUserService;

    @PostMapping
    public ResponseEntity<?> createUser(@PathVariable Integer companyId,
                                        @Valid @RequestBody AppUserRequestDto request) {
        try {
            AppUser createdUser = appUserService.createUser(companyId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<AppUser>> getUsersByCompany(@PathVariable Integer companyId) {
        return ResponseEntity.ok(appUserService.getUsersByCompany(companyId));
    }
}
