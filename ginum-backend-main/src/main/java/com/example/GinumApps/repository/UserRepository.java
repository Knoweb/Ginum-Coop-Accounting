package com.example.GinumApps.repository;

import com.example.GinumApps.model.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<AppUser, Integer> {
    List<AppUser> findByCompany_CompanyId(Integer companyId);
    Optional<AppUser> findByEmail(String email);
}