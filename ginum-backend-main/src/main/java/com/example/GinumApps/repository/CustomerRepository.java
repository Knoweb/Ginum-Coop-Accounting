package com.example.GinumApps.repository;

import com.example.GinumApps.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    List<Customer> findByCompany_CompanyId(Integer companyId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(so) FROM SalesOrder so WHERE so.customer.id = :customerId")
    long countSalesUsage(@org.springframework.data.repository.query.Param("customerId") Long customerId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(inv) FROM Invoice inv WHERE inv.customer.id = :customerId")
    long countInvoiceUsage(@org.springframework.data.repository.query.Param("customerId") Long customerId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(p) FROM Project p WHERE p.customer.id = :customerId")
    long countProjectUsage(@org.springframework.data.repository.query.Param("customerId") Long customerId);
}
