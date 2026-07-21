package com.example.GinumApps.config;

import com.example.GinumApps.filter.JwtFilter;
import jakarta.servlet.DispatcherType;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth

                        // Allow CORS preflight requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Allow Spring error page also
                        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                        .requestMatchers("/error").permitAll()

                        // Public endpoints
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/companies/register",
                                "/api/countries",
                                "/api/countries/**",
                                "/api/currencies",
                                "/api/currencies/**",
                                "/api/coop/postings",
                                "/api/coop/postings/**"
                        ).permitAll()

                        // Demo Seeder & Reconcile endpoints
                        .requestMatchers(HttpMethod.POST, "/api/demo/seed/company/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/demo/seed-transactions/company/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/demo/reconcile/company/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/demo/reset-excel-demo/company/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/demo/fresh-excel-reset/company/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/demo/excel-phase1/company/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/demo/excel-phase2/company/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/demo/excel-fix-visibility/company/**").permitAll()

                        // Purchase order endpoints
                        .requestMatchers(
                                "/api/*/purchase-orders",
                                "/api/*/purchase-orders/**",
                                "/api/purchase-orders/**"
                        )
                        .hasAnyAuthority(
                                "COMPANY",
                                "ROLE_COMPANY",
                                "EMPLOYEE",
                                "ROLE_EMPLOYEE",
                                "APP_USER",
                                "ROLE_APP_USER",
                                "SUPER_ADMIN",
                                "ROLE_SUPER_ADMIN"
                        )

                        // Project endpoints
                        .requestMatchers(
                                "/api/companies/*/projects",
                                "/api/companies/*/projects/**"
                        )
                        .hasAnyAuthority(
                                "COMPANY",
                                "ROLE_COMPANY",
                                "EMPLOYEE",
                                "ROLE_EMPLOYEE",
                                "APP_USER",
                                "ROLE_APP_USER",
                                "SUPER_ADMIN",
                                "ROLE_SUPER_ADMIN"
                        )

                        // Report endpoints
                        .requestMatchers(
                                "/api/companies/*/reports",
                                "/api/companies/*/reports/**"
                        )
                        .hasAnyAuthority(
                                "COMPANY",
                                "ROLE_COMPANY",
                                "EMPLOYEE",
                                "ROLE_EMPLOYEE",
                                "APP_USER",
                                "ROLE_APP_USER",
                                "SUPER_ADMIN",
                                "ROLE_SUPER_ADMIN"
                        )

                        // Account endpoints
                        .requestMatchers(
                                "/api/companies/*/accounts",
                                "/api/companies/*/accounts/**"
                        )
                        .hasAnyAuthority(
                                "COMPANY",
                                "ROLE_COMPANY",
                                "EMPLOYEE",
                                "ROLE_EMPLOYEE",
                                "APP_USER",
                                "ROLE_APP_USER",
                                "SUPER_ADMIN",
                                "ROLE_SUPER_ADMIN"
                        )

                        // Company endpoints
                        .requestMatchers("/api/companies/**")
                        .hasAnyAuthority(
                                "COMPANY",
                                "ROLE_COMPANY",
                                "SUPER_ADMIN",
                                "ROLE_SUPER_ADMIN"
                        )

                        // Employee and supplier endpoints
                        .requestMatchers(
                                "/api/employees/**",
                                "/api/suppliers/**"
                        )
                        .hasAnyAuthority(
                                "EMPLOYEE",
                                "ROLE_EMPLOYEE",
                                "COMPANY",
                                "ROLE_COMPANY",
                                "SUPER_ADMIN",
                                "ROLE_SUPER_ADMIN"
                        )

                        // Customer endpoints
                        .requestMatchers(
                                "/api/companies/*/items",
                                "/api/companies/*/items/**"
                        )
                        .hasAnyAuthority(
                                "COMPANY",
                                "ROLE_COMPANY",
                                "EMPLOYEE",
                                "ROLE_EMPLOYEE",
                                "APP_USER",
                                "ROLE_APP_USER",
                                "SUPER_ADMIN",
                                "ROLE_SUPER_ADMIN"
                        )

                        // All other endpoints need login
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config
    ) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOriginPatterns(List.of("*"));

        config.setAllowedMethods(
                Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
        );

        config.setAllowedHeaders(
                Arrays.asList("*")
        );

        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);
        return source;
    }
}