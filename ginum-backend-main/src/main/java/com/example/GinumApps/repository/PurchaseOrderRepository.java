package com.example.GinumApps.repository;

import com.example.GinumApps.model.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    @Query("SELECT MAX(p.poNumber) FROM PurchaseOrder p WHERE p.company.companyId = :companyId")
    String findLastPoNumberByCompanyId(@Param("companyId") Long companyId);

    List<PurchaseOrder> findByCompany_CompanyId(Integer companyId);
    java.util.Optional<PurchaseOrder> findByPoNumberAndCompany_CompanyId(String poNumber, Integer companyId);
    boolean existsBySupplier_Id(Long supplierId);
}