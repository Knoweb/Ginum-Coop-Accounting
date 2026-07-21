package com.example.GinumApps.controller;

import com.example.GinumApps.dto.FixedAssetRequestDto;
import com.example.GinumApps.dto.FixedAssetResponseDto;
import com.example.GinumApps.service.FixedAssetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FixedAssetController {

    private final FixedAssetService fixedAssetService;

    @GetMapping("/companies/{companyId}")
    public ResponseEntity<List<FixedAssetResponseDto>> getFixedAssetsByCompany(
            @PathVariable Integer companyId
    ) {
        return ResponseEntity.ok(fixedAssetService.getFixedAssetsByCompany(companyId));
    }

    @PostMapping("/companies/{companyId}")
    public ResponseEntity<FixedAssetResponseDto> createFixedAsset(
            @PathVariable Integer companyId,
            @RequestBody FixedAssetRequestDto requestDto
    ) {
        return ResponseEntity.ok(fixedAssetService.createFixedAsset(requestDto, companyId));
    }

    @DeleteMapping("/{assetId}")
    public ResponseEntity<Void> deleteFixedAsset(@PathVariable Long assetId) {
        fixedAssetService.deleteFixedAsset(assetId);
        return ResponseEntity.ok().build();
    }
}
