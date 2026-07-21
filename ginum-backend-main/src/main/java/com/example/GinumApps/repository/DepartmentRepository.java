package com.example.GinumApps.repository;

import com.example.GinumApps.model.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Integer> {

    List<Department> findByCompany_CompanyId(Integer companyId);
    List<Department> findByCompany_CompanyIdAndActiveTrue(Integer companyId);
    Optional<Department> findByCompany_CompanyIdAndCode(Integer companyId, String code);
}
