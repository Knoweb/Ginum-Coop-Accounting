package com.example.GinumApps.enums;

public enum AccountType {

    // Asset Types
    ASSET_BANK("Asset", "Bank"),
    ASSET_ACCOUNT_RECEIVABLE("Asset", "Account Receivable"),
    ASSET_OTHER_CURRENT_ASSET("Asset", "Other Current Asset"),
    ASSET_FIXED_ASSET("Asset", "Fixed Asset"),
    ASSET_OTHER_ASSET("Asset", "Other Asset"),

    // Liability Types
    LIABILITY_CREDIT_CARD("Liability", "Credit Card"),
    LIABILITY_ACCOUNTS_PAYABLE("Liability", "Accounts Payable"),
    LIABILITY_OTHER_CURRENT_LIABILITY("Liability", "Other Current Liability"),
    LIABILITY_LONG_TERM_LIABILITY("Liability", "Long Term Liability"),
    LIABILITY_OTHER_LIABILITY("Liability", "Other Liability"),

    // Other categories
    EQUITY("Equity", "Equity"),
    INCOME("Income", "Income"),
    COST_OF_SALES("Cost of Sales","Cost of Sales"),
    EXPENSE("Expense", "Expense"),
    OTHER_INCOME("Other Income", "Other Income"),
    OTHER_EXPENSE("Other Expense", "Other Expense");

    private final String mainCategory;
    private final String subCategory;

    AccountType(String mainCategory, String subCategory) {
        this.mainCategory = mainCategory;
        this.subCategory = subCategory;
    }

    public String getMainCategory() {
        return mainCategory;
    }

    public String getSubCategory() {
        return subCategory;
    }

    public boolean isDebitType() {
        return switch (this.mainCategory) {
            case "Asset", "Expense", "Cost of Sales" -> true;
            case "Liability", "Equity", "Income", "Other Income" -> false;
            default -> throw new IllegalArgumentException("Unexpected category: " + mainCategory);
        };
    }
}
