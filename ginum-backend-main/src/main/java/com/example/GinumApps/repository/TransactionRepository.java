package com.example.GinumApps.repository;

import com.example.GinumApps.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;


@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Integer> {
    @Query("SELECT t FROM Transaction t WHERE t.company.companyId = :companyId OR t.company IS NULL")
    List<Transaction> findByCompanyId(@Param("companyId") Integer companyId);
}