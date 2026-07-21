package com.example.GinumApps.repository;

import com.example.GinumApps.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    List<Supplier> findByCompany_CompanyId(Integer companyId);

    List<Supplier> findByCompany_CompanyIdAndActiveTrue(Integer companyId);
}