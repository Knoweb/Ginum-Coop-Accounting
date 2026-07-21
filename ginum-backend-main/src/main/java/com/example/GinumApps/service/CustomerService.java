package com.example.GinumApps.service;

import com.example.GinumApps.dto.CustomerDto;
import com.example.GinumApps.dto.CustomerSummaryDto;
import com.example.GinumApps.model.Company;
import com.example.GinumApps.model.Currency;
import com.example.GinumApps.model.Customer;
import com.example.GinumApps.repository.CompanyRepository;
import com.example.GinumApps.repository.CurrencyRepository;
import com.example.GinumApps.repository.CustomerRepository;
import com.example.GinumApps.exception.ResourceNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CompanyRepository companyRepository;
    private final CurrencyRepository currencyRepository;

    @Transactional
    public Customer createCustomer(CustomerDto customerDto) throws IOException {
        // Validate and fetch related entities
        Company company = companyRepository.findById(customerDto.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + customerDto.getCompanyId()));

        Currency currency = currencyRepository.findById(customerDto.getCurrencyId())
                .orElseThrow(() -> new ResourceNotFoundException("Currency not found with id: " + customerDto.getCurrencyId()));

        // Map DTO to Entity
        Customer customer = new Customer();
        customer.setName(customerDto.getName());
        customer.setPhoneNo(customerDto.getPhoneNo());
        customer.setEmail(customerDto.getEmail());
        customer.setNicNo(customerDto.getNicNo());
        customer.setCustomerType(customerDto.getCustomerType());
        customer.setVat(customerDto.getVat());
        customer.setTinNo(customerDto.getTinNo());
        customer.setDeliveryAddress(customerDto.getDeliveryAddress());
        customer.setTax(customerDto.getTax());
        customer.setBillingAddress(customerDto.getBillingAddress());
        customer.setSwiftNo(customerDto.getSwiftNo());
        customer.setCurrency(currency);
        customer.setDiscountPercentage(customerDto.getDiscountPercentage());
        customer.setCompany(company);

        if (customerDto.getBusinessRegistration() != null
                && !customerDto.getBusinessRegistration().isEmpty()) {
            customer.setBusinessRegistration(
                    customerDto.getBusinessRegistration().getBytes()
            );
        }
        return customerRepository.save(customer);
    }

    public List<CustomerSummaryDto> getCustomersByCompanyId(Integer companyId) {
        companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));

        List<Customer> customers = customerRepository.findByCompany_CompanyId(companyId);
        return customers.stream().map(this::convertToSummaryDto).collect(Collectors.toList());
    }

    private CustomerSummaryDto convertToSummaryDto(Customer customer) {
        return CustomerSummaryDto.builder()
                .customerId(customer.getId())
                .customerName(customer.getName())
                .email(customer.getEmail())
                .mobileNo(customer.getPhoneNo())
                .address(customer.getBillingAddress())
                .customerType(customer.getCustomerType())
                .tax(customer.getTax())
                .build();
    }

    @Transactional
    public Customer updateCustomer(Long customerId, CustomerDto customerDto) throws IOException {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));
        
        if (!customer.getCompany().getCompanyId().equals(customerDto.getCompanyId())) {
            throw new IllegalStateException("Customer does not belong to the specified company.");
        }

        Currency currency = currencyRepository.findById(customerDto.getCurrencyId())
                .orElseThrow(() -> new ResourceNotFoundException("Currency not found with id: " + customerDto.getCurrencyId()));

        customer.setName(customerDto.getName());
        customer.setPhoneNo(customerDto.getPhoneNo());
        customer.setEmail(customerDto.getEmail());
        customer.setNicNo(customerDto.getNicNo());
        customer.setCustomerType(customerDto.getCustomerType());
        customer.setVat(customerDto.getVat());
        customer.setTinNo(customerDto.getTinNo());
        customer.setDeliveryAddress(customerDto.getDeliveryAddress());
        customer.setTax(customerDto.getTax());
        customer.setBillingAddress(customerDto.getBillingAddress());
        customer.setSwiftNo(customerDto.getSwiftNo());
        customer.setCurrency(currency);
        customer.setDiscountPercentage(customerDto.getDiscountPercentage());

        if (customerDto.getBusinessRegistration() != null && !customerDto.getBusinessRegistration().isEmpty()) {
            customer.setBusinessRegistration(customerDto.getBusinessRegistration().getBytes());
        }

        return customerRepository.save(customer);
    }

    @Transactional
    public void deleteCustomer(Integer companyId, Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));

        if (!customer.getCompany().getCompanyId().equals(companyId)) {
            throw new IllegalStateException("Customer does not belong to the specified company.");
        }

        long salesUsage = customerRepository.countSalesUsage(customerId);
        long invoiceUsage = customerRepository.countInvoiceUsage(customerId);
        long projectUsage = customerRepository.countProjectUsage(customerId);

        if (salesUsage > 0 || invoiceUsage > 0 || projectUsage > 0) {
            throw new IllegalStateException("Customer is already used in transactions and cannot be deleted.");
        }

        customerRepository.delete(customer);
    }

    public Customer getCustomerById(Long customerId) {
        return customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));
    }
}

