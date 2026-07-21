package com.example.GinumApps.controller;

import com.example.GinumApps.dto.PurchaseOrderRequestDto;
import com.example.GinumApps.dto.PurchaseOrderResponseDto;
import com.example.GinumApps.dto.PurchasePaymentRequestDto;
import com.example.GinumApps.service.PurchaseOrderService;
import com.example.GinumApps.validation.PurchaseOrderValidator;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.InitBinder;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;
    private final PurchaseOrderValidator purchaseOrderValidator;

    @InitBinder("purchaseOrderRequestDto")
    protected void initBinder(WebDataBinder binder) {
        binder.addValidators(purchaseOrderValidator);
    }

    @GetMapping("/api/{companyId}/purchase-orders")
    public ResponseEntity<List<PurchaseOrderResponseDto>> getPurchaseOrdersByCompany(
            @PathVariable Integer companyId
    ) {
        List<PurchaseOrderResponseDto> response =
                purchaseOrderService.getPurchaseOrdersByCompany(companyId);

        return ResponseEntity.ok(response);
    }

    @PostMapping({"/api/{companyId}/purchase-orders", "/api/purchase-orders/company/{companyId}"})
    public ResponseEntity<PurchaseOrderResponseDto> createPurchaseOrder(
            @PathVariable Integer companyId,
            @Valid @RequestBody PurchaseOrderRequestDto request
    ) {
        PurchaseOrderResponseDto response = purchaseOrderService.createPurchaseOrder(request, companyId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/api/{companyId}/purchase-orders/{poId}/pay")
    public ResponseEntity<?> payPurchaseOrder(
            @PathVariable Integer companyId,
            @PathVariable Long poId,
            @RequestBody @Valid PurchasePaymentRequestDto request
    ) {
        if (!companyId.equals(request.getCompanyId())) {
            throw new AccessDeniedException("Access denied: Company mismatch");
        }
        purchaseOrderService.payPurchaseOrder(poId, request);
        return ResponseEntity.ok("Payment recorded successfully");
    }

    // Exception handler for validation errors
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleValidationExceptions(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }

    // Exception handler for not found errors
    @ResponseStatus(HttpStatus.NOT_FOUND)
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<String> handleNotFoundExceptions(EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ResponseStatus(HttpStatus.FORBIDDEN)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<String> handleAccessDeniedExceptions(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ex.getMessage());
    }
}