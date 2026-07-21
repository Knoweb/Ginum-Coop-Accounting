package com.example.GinumApps.service;

import com.example.GinumApps.dto.CompanyRequestDto;
import com.example.GinumApps.enums.RequestStatus;
import com.example.GinumApps.exception.ResourceNotFoundException;
import com.example.GinumApps.model.Company;
import com.example.GinumApps.model.CompanyRequest;
import com.example.GinumApps.repository.CompanyRepository;
import com.example.GinumApps.repository.CompanyRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompanyRequestService {

    private final CompanyRequestRepository requestRepo;
    private final CompanyRepository companyRepo;

    public List<CompanyRequestDto> getRequestsByCompany(Integer companyId) {
        return requestRepo.findByCompany_CompanyId(companyId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public CompanyRequestDto getRequestById(Long id) {
        CompanyRequest request = requestRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));
        return convertToDto(request);
    }

    public CompanyRequestDto createRequest(Integer companyId, CompanyRequestDto dto) {
        Company company = companyRepo.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
        
        CompanyRequest request = new CompanyRequest();
        request.setCompany(company);
        request.setRequestType(dto.getRequestType());
        request.setTitle(dto.getTitle());
        request.setDescription(dto.getDescription());
        request.setPriority(dto.getPriority());
        request.setRequestedBy(dto.getRequestedBy());
        
        CompanyRequest saved = requestRepo.save(request);
        return convertToDto(saved);
    }

    public CompanyRequestDto updateRequest(Long id, CompanyRequestDto dto) {
        CompanyRequest request = requestRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        if (request.getStatus() != RequestStatus.PENDING && request.getStatus() != RequestStatus.IN_REVIEW) {
            throw new IllegalStateException("Only Pending or In Review requests can be modified.");
        }

        request.setRequestType(dto.getRequestType());
        request.setTitle(dto.getTitle());
        request.setDescription(dto.getDescription());
        request.setPriority(dto.getPriority());

        CompanyRequest saved = requestRepo.save(request);
        return convertToDto(saved);
    }

    public void deleteRequest(Long id) {
        CompanyRequest request = requestRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));
        requestRepo.delete(request);
    }

    public CompanyRequestDto approveRequest(Long id, String approvedBy) {
        CompanyRequest request = requestRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));
        
        request.setStatus(RequestStatus.APPROVED);
        request.setApprovedBy(approvedBy);
        request.setApprovedDate(LocalDate.now());
        
        CompanyRequest saved = requestRepo.save(request);
        return convertToDto(saved);
    }

    public CompanyRequestDto rejectRequest(Long id, String rejectedBy, String reason) {
        CompanyRequest request = requestRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));
        
        request.setStatus(RequestStatus.REJECTED);
        request.setRejectedBy(rejectedBy);
        request.setRejectReason(reason);
        request.setRejectedDate(LocalDate.now());
        
        CompanyRequest saved = requestRepo.save(request);
        return convertToDto(saved);
    }

    private CompanyRequestDto convertToDto(CompanyRequest request) {
        CompanyRequestDto dto = new CompanyRequestDto();
        dto.setId(request.getId());
        dto.setRequestType(request.getRequestType());
        dto.setTitle(request.getTitle());
        dto.setDescription(request.getDescription());
        dto.setPriority(request.getPriority());
        dto.setStatus(request.getStatus());
        dto.setRequestedBy(request.getRequestedBy());
        dto.setRequestedDate(request.getRequestedDate());
        dto.setApprovedBy(request.getApprovedBy());
        dto.setApprovedDate(request.getApprovedDate());
        dto.setRejectedBy(request.getRejectedBy());
        dto.setRejectedDate(request.getRejectedDate());
        dto.setRejectReason(request.getRejectReason());
        return dto;
    }
}
