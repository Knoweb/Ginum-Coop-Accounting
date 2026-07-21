package com.example.GinumApps.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum CompanyCategory {
    EDUCATION_AND_EDTECH("Education and EdTech"),
    FINANCE("Finance"),
    CREATIVE_AND_DESIGN("Creative and Design"),
    REAL_ESTATE_AND_PROPERTY_MANAGEMENT("Real Estate and Property Management"),
    CONSTRUCTION_AND_ENGINEERING("Construction and Engineering"),
    HOSPITALITY_AND_TOURISM("Hospitality and Tourism"),
    IT_AND_TECHNOLOGY("IT and Technology"),
    MARKETING_AND_E_COMMERCE("Marketing and E-Commerce"),
    MANUFACTURING_AND_LOGISTICS("Manufacturing and Logistics"),
    HEALTHCARE_AND_LIFE_SCIENCES("Healthcare and Life Sciences"),
    PROFESSIONAL_SERVICES("Professional Services");


    private final String displayName;

    CompanyCategory(String displayName) {
        this.displayName = displayName;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    @JsonCreator
    public static CompanyCategory fromValue(String value) {
        for (CompanyCategory category : values()) {
            if (category.name().equalsIgnoreCase(value) || category.displayName.equalsIgnoreCase(value)) {
                return category;
            }
        }
        throw new IllegalArgumentException("Invalid company category: " + value);
    }
}
