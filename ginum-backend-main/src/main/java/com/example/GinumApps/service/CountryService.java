package com.example.GinumApps.service;

import com.example.GinumApps.dto.CountryResponseDto;
import com.example.GinumApps.model.Country;
import com.example.GinumApps.repository.CountryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CountryService {

    @Autowired
    private CountryRepository countryRepository;

    public List<CountryResponseDto> getAllCountries() {
        return countryRepository.findAll().stream().map(this::convertToDto).collect(Collectors.toList());
    }

    private CountryResponseDto convertToDto(Country country) {
        CountryResponseDto dto = new CountryResponseDto();
        dto.setId(country.getId());
        dto.setName(country.getName());
        if (country.getDefaultCurrency() != null) {
            dto.setDefaultCurrencyId(country.getDefaultCurrency().getId());
            dto.setDefaultCurrencyCode(country.getDefaultCurrency().getCode());
            dto.setDefaultCurrencySymbol(country.getDefaultCurrency().getSymbol());
        }
        return dto;
    }
}
