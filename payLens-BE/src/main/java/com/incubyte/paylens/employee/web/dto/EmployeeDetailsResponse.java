package com.incubyte.paylens.employee.web.dto;

import java.math.BigDecimal;

import com.incubyte.paylens.employee.domain.EmploymentStatus;

public record EmployeeDetailsResponse(
        Long id,
        String employeeNumber,
        String firstName,
        String lastName,
        String jobTitle,
        String department,
        String country,
        EmploymentStatus employmentStatus,
        BigDecimal currentSalary,
        String currency
) {
}

