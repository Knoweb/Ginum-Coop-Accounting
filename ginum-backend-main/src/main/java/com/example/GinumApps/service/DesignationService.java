package com.example.GinumApps.service;

import com.example.GinumApps.dto.DesignationDto;
import com.example.GinumApps.exception.ResourceNotFoundException;
import com.example.GinumApps.model.Company;
import com.example.GinumApps.model.Department;
import com.example.GinumApps.model.Designation;
import com.example.GinumApps.repository.CompanyRepository;
import com.example.GinumApps.repository.DepartmentRepository;
import com.example.GinumApps.repository.DesignationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DesignationService {
    private final DesignationRepository designationRepository;
    private final DepartmentRepository departmentRepository;
    private final CompanyRepository companyRepository;

    public DesignationDto createDesignation(Integer companyId, DesignationDto designationDto) {
        validateCompany(companyId);
        validateDesignationInput(designationDto);

        Department department = departmentRepository.findByCompany_CompanyIdAndCode(companyId, designationDto.getDepartmentCode().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with code: " + designationDto.getDepartmentCode()));

        Designation designation = new Designation();
        designation.setName(designationDto.getName().trim());
        designation.setDepartment(department);
        designation.setActive(designationDto.getActive() != null ? designationDto.getActive() : true);
        return mapToDto(designationRepository.save(designation));
    }

    public List<DesignationDto> getDesignationsByCompanyId(Integer companyId) {
        validateCompany(companyId);
        return designationRepository.findByCompany_CompanyId(companyId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public DesignationDto updateDesignation(Integer companyId, Integer designationId, DesignationDto designationDto) {
        Designation designation = findDesignationForCompany(companyId, designationId);
        validateDesignationInput(designationDto);

        Department department = departmentRepository.findByCompany_CompanyIdAndCode(companyId, designationDto.getDepartmentCode().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with code: " + designationDto.getDepartmentCode()));

        designation.setName(designationDto.getName().trim());
        designation.setDepartment(department);
        if (designationDto.getActive() != null) {
            designation.setActive(designationDto.getActive());
        }
        return mapToDto(designationRepository.save(designation));
    }

    public DesignationDto updateDesignationActiveStatus(Integer companyId, Integer designationId, Boolean active) {
        Designation designation = findDesignationForCompany(companyId, designationId);
        designation.setActive(active != null ? active : true);
        return mapToDto(designationRepository.save(designation));
    }

    public List<DesignationDto> getActiveDesignationsByCompany(Integer companyId) {
        validateCompany(companyId);
        return designationRepository.findByDepartment_Company_CompanyIdAndActiveTrue(companyId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<DesignationDto> getDesignationsByDepartmentCode(Integer companyId, String departmentCode) {
        Department department = departmentRepository.findByCompany_CompanyIdAndCode(companyId, departmentCode)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with code: " + departmentCode));
        return designationRepository.findByDepartment_Id(department.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private Designation findDesignationForCompany(Integer companyId, Integer designationId) {
        validateCompany(companyId);

        Designation designation = designationRepository.findById(designationId)
                .orElseThrow(() -> new ResourceNotFoundException("Designation not found with id: " + designationId));

        if (designation.getDepartment() == null || designation.getDepartment().getCompany() == null ||
                !companyId.equals(designation.getDepartment().getCompany().getCompanyId())) {
            throw new IllegalArgumentException("Designation does not belong to company id: " + companyId);
        }

        return designation;
    }

    private void validateCompany(Integer companyId) {
        companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));
    }

    private void validateDesignationInput(DesignationDto designationDto) {
        if (designationDto == null) {
            throw new IllegalArgumentException("Designation payload is required");
        }
        if (designationDto.getName() == null || designationDto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Designation name is required");
        }
        if (designationDto.getDepartmentCode() == null || designationDto.getDepartmentCode().trim().isEmpty()) {
            throw new IllegalArgumentException("Department code is required");
        }
    }

    private DesignationDto mapToDto(Designation designation) {
        DesignationDto dto = new DesignationDto();
        dto.setId(designation.getId());
        dto.setName(designation.getName());
        dto.setDepartmentCode(designation.getDepartment() != null ? designation.getDepartment().getCode() : null);
        dto.setDepartmentName(designation.getDepartment() != null ? designation.getDepartment().getName() : null);
        dto.setActive(designation.getActive());
        return dto;
    }
}
