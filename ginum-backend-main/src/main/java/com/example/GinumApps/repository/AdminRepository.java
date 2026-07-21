package com.example.GinumApps.repository;

import com.example.GinumApps.model.Admin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminRepository extends JpaRepository<Admin, Integer> {
    Optional<Admin> findByEmail(String email);

    boolean existsByEmail(String email);
}
