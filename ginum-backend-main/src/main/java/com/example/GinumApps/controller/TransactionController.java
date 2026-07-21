package com.example.GinumApps.controller;
import com.example.GinumApps.dto.TransactionDto;
import com.example.GinumApps.dto.DirectPaymentRequestDto;
import com.example.GinumApps.model.Transaction;
import com.example.GinumApps.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping("/companies/{companyId}")
    public ResponseEntity<?> createTransaction(@PathVariable Integer companyId, @RequestBody TransactionDto dto) {
        return ResponseEntity.ok(transactionService.saveTransaction(companyId, dto));
    }

    @PostMapping("/companies/{companyId}/spend-direct")
    public ResponseEntity<?> createDirectPayment(
            @PathVariable Integer companyId,
            @Valid @RequestBody DirectPaymentRequestDto dto
    ) {
        return ResponseEntity.ok(transactionService.processDirectPayment(companyId, dto));
    }

    @GetMapping("/companies/{companyId}")
    public ResponseEntity<List<Transaction>> getAllTransactions(@PathVariable Integer companyId) {
        return ResponseEntity.ok(transactionService.getAllTransactions(companyId));
    }

    @DeleteMapping("/{transactionId}/companies/{companyId}")
    public ResponseEntity<?> deleteTransaction(
            @PathVariable Integer companyId,
            @PathVariable Integer transactionId
    ) {
        transactionService.deleteTransaction(companyId, transactionId);
        return ResponseEntity.ok(java.util.Map.of("message", "Transaction deleted successfully"));
    }
}
