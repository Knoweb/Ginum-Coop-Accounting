package com.example.GinumApps.repository;

import com.example.GinumApps.model.Designation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DesignationRepository extends JpaRepository<Designation, Integer> {
    @Override
    Optional<Designation> findById(Integer integer);

    List<Designation> findByDepartment_Id(Integer id);
    List<Designation> findByDepartment_Company_CompanyId(Integer companyId);
    List<Designation> findByDepartment_Company_CompanyIdAndActiveTrue(Integer companyId);

    default List<Designation> findByCompany_CompanyId(Integer companyId) {
        return findByDepartment_Company_CompanyId(companyId);
    }
}
