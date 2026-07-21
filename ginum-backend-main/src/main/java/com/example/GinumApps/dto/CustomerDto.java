package com.example.GinumApps.dto;

import com.example.GinumApps.enums.CustomerType;
import com.example.GinumApps.enums.TaxType;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class CustomerDto {
    @NotBlank(message = "Name is mandatory")
    private String name;

    @NotBlank(message = "Phone number is mandatory")
    @Pattern(regexp = "^\\+?[0-9\\s-]{10,}$", message = "Invalid phone number format")
    private String phoneNo;

    @Email(message = "Invalid email format")
    private String email;

    private String nicNo;

    @NotNull(message = "Customer type is mandatory")
    private CustomerType customerType;

    private String vat;
    private String tinNo;

    @NotBlank(message = "Delivery address is mandatory")
    private String deliveryAddress;

    @NotNull(message = "Tax type is mandatory")
    private TaxType tax;

    @NotBlank(message = "Billing address is mandatory")
    private String billingAddress;

    private String swiftNo;

    @NotNull(message = "Currency is mandatory")
    private Integer currencyId;

    @DecimalMin(value = "0.0", message = "Discount cannot be negative")
    @DecimalMax(value = "100.0", message = "Discount cannot exceed 100%")
    private Double discountPercentage;

    private MultipartFile businessRegistration;

    @NotNull(message = "Company is mandatory")
    private Integer companyId;
}
