package com.example.GinumApps.repository;

import com.example.GinumApps.model.Item;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ItemRepository extends JpaRepository<Item, Long> {

    List<Item> findByCompany_CompanyId(Integer companyId);

    Optional<Item> findByItemIdAndCompany_CompanyId(Long itemId, Integer companyId);

    boolean existsByItemCodeIgnoreCaseAndCompany_CompanyId(String itemCode, Integer companyId);

    boolean existsByItemCodeIgnoreCaseAndCompany_CompanyIdAndItemIdNot(
            String itemCode,
            Integer companyId,
            Long itemId
    );

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(st) FROM StockTransaction st WHERE st.item.itemId = :itemId AND st.notes != 'Opening stock'")
    long countStockUsage(@org.springframework.data.repository.query.Param("itemId") Long itemId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(soi) FROM SalesOrderLineItem soi WHERE soi.item.itemId = :itemId")
    long countSalesUsage(@org.springframework.data.repository.query.Param("itemId") Long itemId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(poi) FROM PurchaseOrderLineItem poi WHERE poi.item.itemId = :itemId")
    long countPurchaseUsage(@org.springframework.data.repository.query.Param("itemId") Long itemId);
}