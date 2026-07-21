package com.example.GinumApps.dto;

import com.example.GinumApps.enums.ItemCategory;
import com.example.GinumApps.enums.SupplierType;
import com.example.GinumApps.enums.TaxType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierDto {

    @NotBlank(message = "Supplier name is mandatory")
    private String supplierName;

    @Email(message = "Invalid email format")
    private String email;

    @Pattern(regexp = "^\\+?[0-9\\s-]{10,}$", message = "Invalid mobile number format")
    private String mobileNo;

    @NotBlank(message = "Address is mandatory")
    private String address;

    @NotNull(message = "Supplier type is mandatory")
    private SupplierType supplierType;

    private String tinNo;

    @NotNull(message = "Tax type is mandatory")
    private TaxType tax;

    @NotNull(message = "Currency is mandatory")
    private Integer currencyId;

    private MultipartFile businessRegistration;

    @NotNull(message = "Category is required")
    private ItemCategory itemCategory;

    private String swiftNo;

    @DecimalMin(value = "0.0", message = "Discount cannot be negative")
    @DecimalMax(value = "100.0", message = "Discount cannot exceed 100%")
    private Double discountPercentage;
}