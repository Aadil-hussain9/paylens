package com.incubyte.paylens.analytics.repository;

import java.math.BigDecimal;

public record AnalyticsSalaryRangeProjection(
        BigDecimal minSalary,
        BigDecimal p25Salary,
        BigDecimal medianSalary,
        BigDecimal p75Salary,
        BigDecimal maxSalary
) {
}
