package com.example.GinumApps.controller;

import com.example.GinumApps.model.SubscriptionPackage;
import com.example.GinumApps.repository.SubscriptionPackageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/packages")
public class SubscriptionPackageController {

    @Autowired
    private SubscriptionPackageRepository subscriptionPackageRepository;

    @GetMapping
    public List<SubscriptionPackage> getAllPackages() {
        return subscriptionPackageRepository.findAll();
    }
}
