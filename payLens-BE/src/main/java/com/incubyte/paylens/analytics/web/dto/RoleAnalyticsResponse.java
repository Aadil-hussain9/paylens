package com.incubyte.paylens.analytics.web.dto;

import java.math.BigDecimal;

public record RoleAnalyticsResponse(
        String jobTitle,
        long employeeCount,
        BigDecimal totalPayroll,
        BigDecimal averageSalary,
        BigDecimal medianSalary,
        String reportingCurrency
) {
}

