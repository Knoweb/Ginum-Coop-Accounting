package com.example.GinumApps.service;

import com.example.GinumApps.dto.ProjectRequestDto;
import com.example.GinumApps.dto.ProjectResponseDto;
import com.example.GinumApps.model.Company;
import com.example.GinumApps.model.Customer;
import com.example.GinumApps.model.Project;
import com.example.GinumApps.repository.CompanyRepository;
import com.example.GinumApps.repository.CustomerRepository;
import com.example.GinumApps.repository.ProjectRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final CompanyRepository companyRepository;
    private final CustomerRepository customerRepository;

    @Transactional
    public ProjectResponseDto createProject(Integer companyId, ProjectRequestDto request) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found with id: " + companyId));

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + request.getCustomerId()));

        if (!customer.getCompany().getCompanyId().equals(companyId)) {
            throw new RuntimeException("Selected customer does not belong to this company");
        }

        Project project = new Project();
        project.setCode(request.getProjectCode());
        project.setName(request.getProjectName());
        project.setStartDate(request.getStartDate());
        project.setWorkingStatus(request.getWorkingStatus());
        project.setPriority(request.getPriority());
        project.setDescription(request.getDescription());
        project.setCustomer(customer);
        project.setCompany(company);
        project.setTotalCost(0L);

        Project savedProject = projectRepository.save(project);

        return convertToDto(savedProject);
    }

    public List<ProjectResponseDto> getProjectsByCompany(Integer companyId) {
        return projectRepository.findByCompany_CompanyId(companyId)
                .stream()
                .map(this::convertToDto)
                .toList();
    }

    public ProjectResponseDto getProjectById(Integer companyId, Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));

        if (!project.getCompany().getCompanyId().equals(companyId)) {
            throw new RuntimeException("Project does not belong to this company");
        }

        return convertToDto(project);
    }

    @Transactional
    public ProjectResponseDto updateProject(Integer companyId, Long projectId, ProjectRequestDto request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));

        if (!project.getCompany().getCompanyId().equals(companyId)) {
            throw new RuntimeException("Project does not belong to this company");
        }

        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + request.getCustomerId()));

        if (!customer.getCompany().getCompanyId().equals(companyId)) {
            throw new RuntimeException("Selected customer does not belong to this company");
        }

        project.setCode(request.getProjectCode());
        project.setName(request.getProjectName());
        project.setStartDate(request.getStartDate());
        project.setWorkingStatus(request.getWorkingStatus());
        project.setPriority(request.getPriority());
        project.setDescription(request.getDescription());
        project.setCustomer(customer);

        Project updatedProject = projectRepository.save(project);
        return convertToDto(updatedProject);
    }

    @Transactional
    public void deleteProject(Integer companyId, Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));

        if (!project.getCompany().getCompanyId().equals(companyId)) {
            throw new RuntimeException("Project does not belong to this company");
        }

        projectRepository.delete(project);
    }

    private ProjectResponseDto convertToDto(Project project) {
        return ProjectResponseDto.builder()
                .id(project.getId())
                .code(project.getCode())
                .name(project.getName())
                .startDate(project.getStartDate())
                .description(project.getDescription())
                .priority(project.getPriority())
                .workingStatus(project.getWorkingStatus())
                .customerId(project.getCustomer() != null ? project.getCustomer().getId() : null)
                .customerName(project.getCustomer() != null ? project.getCustomer().getName() : null)
                .companyId(project.getCompany() != null ? project.getCompany().getCompanyId() : null)
                .totalCost(project.getTotalCost())
                .build();
    }
}