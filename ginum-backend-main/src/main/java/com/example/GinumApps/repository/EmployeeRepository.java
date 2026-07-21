package com.example.GinumApps.repository;

import com.example.GinumApps.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Integer> {
    boolean existsByNic(String nic);
    boolean existsByEmail(String email);

    Optional<Employee> findByEmail(String username);
    Optional<Employee> findByEmailAndCompanyCompanyId(String email, Integer companyId);

    List<Employee> findAllByCompanyCompanyId(Integer companyId);

    @Query("SELECT e FROM Employee e WHERE e.company.companyId = :companyId")
    List<Employee> findByCompanyId(@Param("companyId") Integer companyId);
}


