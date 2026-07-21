package com.example.GinumApps.controller;

import com.example.GinumApps.dto.CoopPostingPayload;
import com.example.GinumApps.model.CoopPostingLog;
import com.example.GinumApps.repository.CoopPostingLogRepository;
import com.example.GinumApps.service.CoopPostingService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coop/postings")
@RequiredArgsConstructor
public class CoopPostingController {

    private final CoopPostingService postingService;
    private final CoopPostingLogRepository logRepository;

    @Value("${coop.api.key:local-dev-coop-api-key-change-me}")
    private String configuredApiKey;

    @PostMapping
    public ResponseEntity<?> createPosting(
            @RequestHeader(value = "X-COOP-API-KEY", required = false) String apiKey,
            @RequestBody CoopPostingPayload payload) {

        if (apiKey == null || !apiKey.equals(configuredApiKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        try {
            postingService.processPosting(payload);
            return ResponseEntity.ok(Map.of("message", "Posted successfully"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal Server Error: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getLogs(@RequestHeader(value = "X-COOP-API-KEY", required = false) String apiKey) {
        if (apiKey == null || !apiKey.equals(configuredApiKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        return ResponseEntity.ok(logRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getLog(
            @RequestHeader(value = "X-COOP-API-KEY", required = false) String apiKey,
            @PathVariable Long id) {
        if (apiKey == null || !apiKey.equals(configuredApiKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        return logRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
