package com.incubyte.paylens.analytics.repository;

public record SalaryDistributionProjection(
        String range,
        long employeeCount
) {
}

