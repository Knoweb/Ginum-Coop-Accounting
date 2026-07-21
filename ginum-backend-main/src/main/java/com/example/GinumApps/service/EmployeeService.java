package com.example.GinumApps.service;


import com.example.GinumApps.repository.DesignationRepository;
import com.example.GinumApps.dto.EmployeeRequestDto;
import com.example.GinumApps.model.Company;
import com.example.GinumApps.model.Department;
import com.example.GinumApps.model.Designation;
import com.example.GinumApps.model.Employee;
import com.example.GinumApps.repository.CompanyRepository;
import com.example.GinumApps.repository.DepartmentRepository;
import com.example.GinumApps.repository.EmployeeRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final CompanyRepository companyRepository;
    private final DepartmentRepository departmentRepository;
    private final DesignationRepository designationRepository;

    @Transactional
    public Employee createEmployee(EmployeeRequestDto request, Integer companyId)  {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found"));

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new RuntimeException("Department not found"));

        Designation designation = designationRepository.findById(request.getDesignationId())
                .orElseThrow(() -> new RuntimeException("Designation not found"));

        Employee employee = new Employee();
        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setGender(request.getGender());
        employee.setDesignation(designation);
        employee.setDepartment(department);
        employee.setAddress(request.getAddress());
        employee.setMobileNo(request.getMobileNo());
        employee.setDob(request.getDob());
        employee.setNic(request.getNic());
        employee.setEpfNo(request.getEpfNo());
        employee.setEmail(request.getEmail());
        employee.setDateAdded(request.getDateAdded());
        employee.setCompany(company);

        return employeeRepository.save(employee);
    }

    public List<Employee> getEmployeesByCompany(Integer companyId) {
        return employeeRepository.findAllByCompanyCompanyId(companyId);
    }

    @Transactional
    public Employee updateEmployee(Integer employeeId, EmployeeRequestDto request, Integer companyId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        if (!employee.getCompany().getCompanyId().equals(companyId)) {
            throw new RuntimeException("Employee does not belong to this company");
        }

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new RuntimeException("Department not found"));

        Designation designation = designationRepository.findById(request.getDesignationId())
                .orElseThrow(() -> new RuntimeException("Designation not found"));

        employee.setFirstName(request.getFirstName());
        employee.setLastName(request.getLastName());
        employee.setGender(request.getGender());
        employee.setDesignation(designation);
        employee.setDepartment(department);
        employee.setAddress(request.getAddress());
        employee.setMobileNo(request.getMobileNo());
        employee.setDob(request.getDob());
        employee.setNic(request.getNic());
        employee.setEpfNo(request.getEpfNo());
        employee.setEmail(request.getEmail());
        employee.setDateAdded(request.getDateAdded());

        return employeeRepository.save(employee);
    }

    @Transactional
    public void deleteEmployee(Integer employeeId, Integer companyId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        if (!employee.getCompany().getCompanyId().equals(companyId)) {
            throw new RuntimeException("Employee does not belong to this company");
        }

        employeeRepository.delete(employee);
    }
}
