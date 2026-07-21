package com.example.GinumApps.repository;

import com.example.GinumApps.model.AgingReceivableSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AgingReceivableSnapshotRepository extends JpaRepository<AgingReceivableSnapshot, Long> {
}
