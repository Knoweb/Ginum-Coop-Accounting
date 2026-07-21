package com.example.GinumApps.repository;

import com.example.GinumApps.model.CompanyRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompanyRequestRepository extends JpaRepository<CompanyRequest, Long> {
    List<CompanyRequest> findByCompany_CompanyId(Integer companyId);
}
