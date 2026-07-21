package com.example.GinumApps.controller;

import com.example.GinumApps.dto.SalesOrderRequestDto;
import com.example.GinumApps.dto.SalesOrderResponseDto;
import com.example.GinumApps.dto.SalesPaymentRequestDto;
import com.example.GinumApps.service.SalesOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales-orders")
@RequiredArgsConstructor
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    @PostMapping("/company/{companyId}")
    public ResponseEntity<SalesOrderResponseDto> createSalesOrder(
            @PathVariable Integer companyId,
            @Valid @RequestBody SalesOrderRequestDto requestDto
    ) {
        SalesOrderResponseDto response =
                salesOrderService.createSalesOrder(requestDto, companyId);

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<SalesOrderResponseDto>> getSalesOrdersByCompany(
            @PathVariable Integer companyId
    ) {
        List<SalesOrderResponseDto> response =
                salesOrderService.getSalesOrdersByCompany(companyId);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{soId}/pay")
    public ResponseEntity<Void> paySalesOrder(
            @PathVariable Long soId,
            @Valid @RequestBody SalesPaymentRequestDto requestDto
    ) {
        salesOrderService.paySalesOrder(soId, requestDto);
        return ResponseEntity.ok().build();
    }
}