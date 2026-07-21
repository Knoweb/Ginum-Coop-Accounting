package com.example.GinumApps.repository;

import com.example.GinumApps.model.SubscriptionPackage;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubscriptionPackageRepository extends JpaRepository<SubscriptionPackage, Integer> {
    Optional<SubscriptionPackage> findById(Integer packageId);
}
