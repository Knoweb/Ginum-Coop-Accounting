package com.example.GinumApps.repository;

import com.example.GinumApps.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByCompany_CompanyId(Integer companyId);
}