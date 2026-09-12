package com.incubyte.paylens.analytics.web.dto;

import java.math.BigDecimal;

public record AnalyticsSummaryResponse(
        long totalEmployees,
        BigDecimal totalPayroll,
        BigDecimal averageSalary,
        BigDecimal medianSalary,
        String reportingCurrency
) {
}

