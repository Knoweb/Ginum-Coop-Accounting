package com.example.GinumApps.config;

import com.example.GinumApps.model.Country;
import com.example.GinumApps.model.Currency;
import com.example.GinumApps.model.SubscriptionPackage;
import com.example.GinumApps.repository.CountryRepository;
import com.example.GinumApps.repository.CurrencyRepository;
import com.example.GinumApps.repository.SubscriptionPackageRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Optional;

@Configuration
public class DatabaseSeeder {

    @Bean
    public CommandLineRunner initDatabase(CountryRepository countryRepository, CurrencyRepository currencyRepository, SubscriptionPackageRepository subscriptionPackageRepository) {
        return args -> {
            // Seed Subscription Package
            Optional<SubscriptionPackage> existingPackage = subscriptionPackageRepository.findById(1);
            if (existingPackage.isEmpty()) {
                SubscriptionPackage basicPackage = new SubscriptionPackage();
                basicPackage.setPackageName("Basic Package");
                basicPackage.setDescription("Default basic subscription package");
                subscriptionPackageRepository.save(basicPackage);
            }

            Currency lkr = seedCurrency(currencyRepository, "LKR", "Sri Lankan Rupee", "Rs.");
            Currency usd = seedCurrency(currencyRepository, "USD", "US Dollar", "$");
            Currency gbp = seedCurrency(currencyRepository, "GBP", "British Pound", "£");
            Currency aud = seedCurrency(currencyRepository, "AUD", "Australian Dollar", "A$");

            // Seed Countries
            seedCountry(countryRepository, "Sri Lanka", lkr);
            seedCountry(countryRepository, "United States", usd);
            seedCountry(countryRepository, "United Kingdom", gbp);
            seedCountry(countryRepository, "Australia", aud);
        };
    }

    private Currency seedCurrency(CurrencyRepository repo, String code, String name, String symbol) {
        Optional<Currency> existing = repo.findByCode(code);
        if (existing.isEmpty()) {
            Currency currency = new Currency();
            currency.setCode(code);
            currency.setName(name);
            currency.setSymbol(symbol);
            return repo.save(currency);
        }
        return existing.get();
    }

    private void seedCountry(CountryRepository repo, String name, Currency defaultCurrency) {
        Optional<Country> existing = repo.findByName(name);
        if (existing.isEmpty()) {
            Country country = new Country();
            country.setName(name);
            country.setDefaultCurrency(defaultCurrency);
            repo.save(country);
        } else {
            Country country = existing.get();
            if (country.getDefaultCurrency() == null) {
                country.setDefaultCurrency(defaultCurrency);
                repo.save(country);
            }
        }
    }
}
