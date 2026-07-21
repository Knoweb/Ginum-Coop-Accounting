package com.example.GinumApps.exception;

public class CompanyExistsException extends RuntimeException {
    public CompanyExistsException(String message) {
        super(message);
    }
}