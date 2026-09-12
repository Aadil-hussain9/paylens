package com.incubyte.paylens.analytics.web.dto;

import java.math.BigDecimal;

public record CountryAnalyticsResponse(
        String country,
        long employeeCount,
        BigDecimal totalPayroll,
        BigDecimal averageSalary,
        BigDecimal medianSalary,
        String reportingCurrency
) {
}

