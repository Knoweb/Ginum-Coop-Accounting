package com.example.GinumApps.controller;

import com.example.GinumApps.dto.CountryResponseDto;
import com.example.GinumApps.service.CountryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/countries")
public class CountryController {

    @Autowired
    private CountryService countryService;

    @GetMapping
    public List<CountryResponseDto> getAllCountries() {
        return countryService.getAllCountries();
    }
}

