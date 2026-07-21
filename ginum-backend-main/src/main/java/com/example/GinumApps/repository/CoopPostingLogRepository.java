package com.example.GinumApps.repository;

import com.example.GinumApps.model.CoopPostingLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CoopPostingLogRepository extends JpaRepository<CoopPostingLog, Long> {
    Optional<CoopPostingLog> findBySourceSystemAndReferenceTypeAndReferenceId(String sourceSystem, String referenceType, String referenceId);
}
