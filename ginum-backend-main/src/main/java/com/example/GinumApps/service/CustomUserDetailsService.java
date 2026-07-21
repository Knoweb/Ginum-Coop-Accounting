package com.example.GinumApps.service;

import com.example.GinumApps.model.Admin;
import com.example.GinumApps.model.AppUser;
import com.example.GinumApps.model.Company;
import com.example.GinumApps.repository.AdminRepository;
import com.example.GinumApps.repository.CompanyRepository;
import com.example.GinumApps.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

// CustomUserDetailsService.java
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final AdminRepository adminRepository;
    private final CompanyRepository companyRepository;
    private final AppUserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Check in all user types
        Optional<Admin> admin = adminRepository.findByEmail(email);
        if (admin.isPresent()) return createUserDetails(admin.get());

        Optional<Company> company = companyRepository.findByEmail(email);
        if (company.isPresent()) return createUserDetails(company.get());

        Optional<AppUser> user = userRepository.findByEmail(email);
        if (user.isPresent()) return createUserDetails(user.get());

        throw new UsernameNotFoundException("User not found with email: " + email);
    }

    private UserDetails createUserDetails(Admin admin) {
        return User.builder()
                .username(admin.getEmail())
                .password(admin.getPassword())
                .roles(admin.getRole().replace("ROLE_", ""))
                .build();
    }

    private UserDetails createUserDetails(Company company) {
        return User.builder()
                .username(company.getEmail())
                .password(company.getPassword())
                .roles(company.getRole().replace("ROLE_", ""))
                .build();
    }

    private UserDetails createUserDetails(AppUser user) {
        return User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .roles(user.getRole().replace("ROLE_", ""))
                .build();
    }
}