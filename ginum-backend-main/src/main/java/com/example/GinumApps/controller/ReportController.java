package com.example.GinumApps.controller;

import com.example.GinumApps.dto.BalanceSheetResponseDto;
import com.example.GinumApps.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/companies/{companyId}/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/balance-sheet")
    public ResponseEntity<BalanceSheetResponseDto> getBalanceSheet(@PathVariable Integer companyId) {
        BalanceSheetResponseDto report = reportService.getBalanceSheet(companyId);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/income-statement")
    public ResponseEntity<com.example.GinumApps.dto.IncomeStatementResponseDto> getIncomeStatement(
            @PathVariable Integer companyId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer quarter,
            @RequestParam(required = false) Integer month
    ) {
        com.example.GinumApps.dto.IncomeStatementResponseDto report = reportService.getIncomeStatement(
                companyId, startDate, endDate, year, quarter, month
        );
        return ResponseEntity.ok(report);
    }

    @GetMapping("/trial-balance")
    public ResponseEntity<com.example.GinumApps.dto.TrialBalanceResponseDto> getTrialBalance(
            @PathVariable Integer companyId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer quarter,
            @RequestParam(required = false) Integer month
    ) {
        com.example.GinumApps.dto.TrialBalanceResponseDto report = reportService.getTrialBalance(
                companyId, startDate, endDate, year, quarter, month
        );
        return ResponseEntity.ok(report);
    }

    @GetMapping("/cash-flow")
    public ResponseEntity<com.example.GinumApps.dto.CashFlowResponseDto> getCashFlow(
            @PathVariable Integer companyId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer quarter,
            @RequestParam(required = false) Integer month
    ) {
        com.example.GinumApps.dto.CashFlowResponseDto report = reportService.getCashFlow(
                companyId, startDate, endDate, year, quarter, month
        );
        return ResponseEntity.ok(report);
    }

    @GetMapping("/general-ledger")
    public ResponseEntity<com.example.GinumApps.dto.GeneralLedgerResponseDto> getGeneralLedger(
            @PathVariable Integer companyId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer quarter,
            @RequestParam(required = false) Integer month
    ) {
        com.example.GinumApps.dto.GeneralLedgerResponseDto report = reportService.getGeneralLedger(
                companyId, startDate, endDate, year, quarter, month
        );
        return ResponseEntity.ok(report);
    }
}
