package com.example.GinumApps.dto;

import lombok.Data;
import java.math.BigDecimal;
import jakarta.validation.constraints.NotNull;

@Data
public class DirectPaymentRequestDto {
    @NotNull(message = "Payee ID is required")
    private Integer payeeId;

    @NotNull(message = "Payee Type is required")
    private String payeeType; // "EMPLOYEE", "OTHER"

    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    @NotNull(message = "Payment Account Code is required")
    private String paymentAccountCode; // bank/cash account code

    @NotNull(message = "Expense Account Code is required")
    private String expenseAccountCode; // salary expense, allowance, etc.

    private String paymentCategory; // "Salary Expense", "Allowance", "Reimbursement", "Other"
    private String paymentMethod; // "Bank Transfer", "Cash", "Cheque", etc.
    private String paymentNote;
    private String referenceNumber;
}
