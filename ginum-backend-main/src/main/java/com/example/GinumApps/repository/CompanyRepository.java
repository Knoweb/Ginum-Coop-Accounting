// CompanyRepository.java
package com.example.GinumApps.repository;

import com.example.GinumApps.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Integer> {
    boolean existsByEmail(String email);
    boolean existsByCompanyRegNo(String regNo);

    Optional<Company> findByEmail(String username);
}
