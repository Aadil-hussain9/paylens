package com.incubyte.paylens.employee.web.dto;

import com.incubyte.paylens.employee.domain.EmploymentStatus;

public record EmployeeSummaryResponse(
        Long id,
        String employeeNumber,
        String firstName,
        String lastName,
        String jobTitle,
        String department,
        String country,
        EmploymentStatus employmentStatus,
        java.math.BigDecimal currentSalary,
        String currency
) {
}

