package com.example.GinumApps.validation;

import com.example.GinumApps.dto.PurchaseOrderRequestDto;
import com.example.GinumApps.dto.PurchaseOrderItemRequestDto;
import com.example.GinumApps.enums.PurchaseType;
import org.springframework.stereotype.Component;
import org.springframework.validation.Errors;
import org.springframework.validation.Validator;

import java.math.BigDecimal;

@Component
public class PurchaseOrderValidator implements Validator {

    @Override
    public boolean supports(Class<?> clazz) {
        return PurchaseOrderRequestDto.class.isAssignableFrom(clazz);
    }

    @Override
    public void validate(Object target, Errors errors) {
        PurchaseOrderRequestDto request = (PurchaseOrderRequestDto) target;

        for (int i = 0; i < request.getItems().size(); i++) {
            PurchaseOrderItemRequestDto item = request.getItems().get(i);
            if (request.getPurchaseType() == PurchaseType.GOODS) {
                if (item.getQuantity() == null || item.getQuantity() <= 0) {
                    errors.rejectValue("items[" + i + "].quantity", "field.required", "Quantity is required for ITEMS");
                }
                if (item.getUnitPrice() == null || item.getUnitPrice().compareTo(BigDecimal.ZERO) <= 0) {
                    errors.rejectValue("items[" + i + "].unitPrice", "field.required", "Unit price is required for ITEMS");
                }
            } else if (request.getPurchaseType() == PurchaseType.SERVICES) {
                if (item.getAmount() == null || item.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                    errors.rejectValue("items[" + i + "].amount", "field.required", "Amount is required for SERVICES");
                }
            }
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        for (PurchaseOrderItemRequestDto item : request.getItems()) {
            if (item.getQuantity() != null && item.getUnitPrice() != null) {
                BigDecimal lineTotal = item.getUnitPrice()
                        .multiply(BigDecimal.valueOf(item.getQuantity()))
                        .multiply(BigDecimal.ONE.subtract(item.getDiscount().divide(BigDecimal.valueOf(100))));
                subtotal = subtotal.add(lineTotal);
            }
        }

        BigDecimal freight = request.getFreight() != null ? request.getFreight() : BigDecimal.ZERO;
        BigDecimal tax = request.getTaxAmount() != null ? request.getTaxAmount() : BigDecimal.ZERO;
        BigDecimal paid = request.getAmountPaid() != null ? request.getAmountPaid() : BigDecimal.ZERO;

        BigDecimal total = subtotal.add(freight).add(tax);
        BigDecimal balanceDue = total.subtract(paid);

        if (balanceDue.compareTo(BigDecimal.ZERO) > 0 && request.getDueDate() == null) {
            errors.rejectValue("dueDate", "field.required", "Due date is required for unpaid purchase orders");
        }
    }
}
