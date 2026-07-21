package com.example.GinumApps.repository;

import com.example.GinumApps.model.Country;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;


@Repository
public interface CountryRepository extends JpaRepository<Country, Integer> {
    Optional<Country> findByName(@NotNull String name);
}
