package com.example.GinumApps.repository;

import com.example.GinumApps.model.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Integer> {
    Optional<AppUser> findByEmail(String email);
    List<AppUser> findAllByCompanyCompanyId(Integer companyId);
}
