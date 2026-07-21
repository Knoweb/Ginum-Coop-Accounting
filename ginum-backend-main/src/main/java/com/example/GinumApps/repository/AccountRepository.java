package com.example.GinumApps.repository;

import com.example.GinumApps.enums.AccountType;
import com.example.GinumApps.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    boolean existsByNormalizedNameAndNormalizedSubAccountAndCompany_CompanyId(
            String normalizedName,
            String normalizedSubAccount,
            Integer companyId
    );
    @Query("SELECT COUNT(a) FROM Account a " +
            "WHERE a.company.companyId = :companyId " +
            "AND a.accountType IN :types " +
            "AND a.accountCode NOT IN :reservedCodes")
    long countByCompanyAndAccountTypes(
            @Param("companyId") Integer companyId,
            @Param("types") List<AccountType> types,
            @Param("reservedCodes") List<String> reservedCodes
    );
    List<Account> findByCompany_CompanyId(Integer companyId);
    
    Optional<Account> findByAccountNameIgnoreCaseAndAccountTypeAndCompany_CompanyId(String accountName, AccountType accountType, Integer companyId);

    Optional<Account> findByAccountCodeAndCompany_CompanyId(String accountCode, Integer companyId);

}