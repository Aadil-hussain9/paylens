package com.incubyte.paylens.dashboard.web.dto;

import java.math.BigDecimal;

public record DepartmentSalary(
        String department,
        BigDecimal minSalary,
        BigDecimal avgSalary,
        BigDecimal maxSalary,
        long employeeCount
) {
}
