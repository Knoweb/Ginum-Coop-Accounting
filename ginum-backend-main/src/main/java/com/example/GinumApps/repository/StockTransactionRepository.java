package com.example.GinumApps.repository;

import com.example.GinumApps.model.StockTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {
    void deleteByItem_ItemId(Long itemId);
}