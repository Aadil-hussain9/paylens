package com.incubyte.paylens.employee.web.dto;

import com.incubyte.paylens.employee.domain.EmploymentStatus;

import org.springframework.data.domain.Sort;

public record EmployeeSearchCriteria(
        int page,
        int pageSize,
        String search,
        String country,
        String department,
        String jobTitle,
        EmploymentStatus employmentStatus,
        String sortBy,
        Sort.Direction sortDirection
) {
}

