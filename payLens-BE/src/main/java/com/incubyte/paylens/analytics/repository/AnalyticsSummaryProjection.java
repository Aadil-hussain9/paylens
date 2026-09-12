package com.incubyte.paylens.analytics.repository;

import java.math.BigDecimal;

public record AnalyticsSummaryProjection(
        long totalEmployees,
        BigDecimal totalPayroll,
        BigDecimal averageSalary,
        BigDecimal medianSalary
) {
}

