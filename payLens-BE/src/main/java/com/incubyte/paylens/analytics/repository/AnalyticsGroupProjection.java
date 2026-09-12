package com.incubyte.paylens.analytics.repository;

import java.math.BigDecimal;

public record AnalyticsGroupProjection(
        String groupValue,
        long employeeCount,
        BigDecimal totalPayroll,
        BigDecimal averageSalary,
        BigDecimal medianSalary
) {
}

