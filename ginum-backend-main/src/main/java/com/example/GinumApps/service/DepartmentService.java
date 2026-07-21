package com.example.GinumApps.service;

import com.example.GinumApps.dto.DepartmentDto;
import com.example.GinumApps.exception.ResourceNotFoundException;
import com.example.GinumApps.model.Company;
import com.example.GinumApps.model.Department;
import com.example.GinumApps.repository.CompanyRepository;
import com.example.GinumApps.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final CompanyRepository companyRepository;
    private final DepartmentRepository departmentRepository;

    public DepartmentDto createDepartment(Integer companyId, DepartmentDto departmentDto) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));

        validateDepartmentInput(departmentDto);

        Department department = new Department();
        department.setName(departmentDto.getName().trim());
        department.setCode(departmentDto.getCode().trim());
        department.setActive(departmentDto.getActive() != null ? departmentDto.getActive() : true);
        department.setCompany(company);
        return mapToDto(departmentRepository.save(department));
    }

    public List<DepartmentDto> getDepartmentsByCompanyId(Integer companyId) {
        validateCompany(companyId);
        return departmentRepository.findByCompany_CompanyId(companyId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public DepartmentDto updateDepartment(Integer companyId, Integer departmentId, DepartmentDto departmentDto) {
        Department department = findDepartmentForCompany(companyId, departmentId);
        validateDepartmentInput(departmentDto);

        department.setName(departmentDto.getName().trim());
        department.setCode(departmentDto.getCode().trim());
        if (departmentDto.getActive() != null) {
            department.setActive(departmentDto.getActive());
        }
        return mapToDto(departmentRepository.save(department));
    }

    public DepartmentDto updateDepartmentActiveStatus(Integer companyId, Integer departmentId, Boolean active) {
        Department department = findDepartmentForCompany(companyId, departmentId);
        department.setActive(active != null ? active : true);
        return mapToDto(departmentRepository.save(department));
    }

    public List<DepartmentDto> getActiveDepartmentsByCompany(Integer companyId) {
        validateCompany(companyId);
        return departmentRepository.findByCompany_CompanyIdAndActiveTrue(companyId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private Department findDepartmentForCompany(Integer companyId, Integer departmentId) {
        validateCompany(companyId);

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + departmentId));

        if (department.getCompany() == null || !companyId.equals(department.getCompany().getCompanyId())) {
            throw new IllegalArgumentException("Department does not belong to company id: " + companyId);
        }

        return department;
    }

    private void validateCompany(Integer companyId) {
        companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));
    }

    private void validateDepartmentInput(DepartmentDto departmentDto) {
        if (departmentDto == null) {
            throw new IllegalArgumentException("Department payload is required");
        }
        if (departmentDto.getName() == null || departmentDto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Department name is required");
        }
        if (departmentDto.getCode() == null || departmentDto.getCode().trim().isEmpty()) {
            throw new IllegalArgumentException("Department code is required");
        }
    }

    private DepartmentDto mapToDto(Department department) {
        DepartmentDto dto = new DepartmentDto();
        dto.setId(department.getId());
        dto.setName(department.getName());
        dto.setCode(department.getCode());
        dto.setActive(department.getActive());
        return dto;
    }
}
