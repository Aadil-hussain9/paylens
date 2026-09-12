package com.incubyte.paylens.analytics.web.dto;

import java.math.BigDecimal;

public record DepartmentAnalyticsResponse(
        String department,
        long employeeCount,
        BigDecimal totalPayroll,
        BigDecimal averageSalary,
        BigDecimal medianSalary,
        String reportingCurrency
) {
}

