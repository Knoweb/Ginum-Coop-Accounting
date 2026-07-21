package com.example.GinumApps.model;

import com.example.GinumApps.enums.AccountType;
import jakarta.persistence.*;
import lombok.Data;

import java.util.List;
@Data
@Entity
@Table(name = "bank_accounts")
public class BankAccount extends Account {

    @Column(nullable = false)
    private String bankName;

    @Column(nullable = false)
    private String branchName;

    @Column(nullable = false, unique = true)
    private String accountNumber;

    public BankAccount() {
        super.setAccountType(AccountType.ASSET_BANK);
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
        // Auto-generate account name only if not explicitly set
        if (super.getAccountName() == null) {
            super.setAccountName("Bank-" + bankName);
        }
    }
    @Override
    public void setAccountType(AccountType accountType) {
        // Prevent changing the account type
        throw new UnsupportedOperationException("Account type cannot be changed for BankAccount");
    }
}
