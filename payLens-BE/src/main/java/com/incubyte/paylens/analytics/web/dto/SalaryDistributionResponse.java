package com.incubyte.paylens.analytics.web.dto;

public record SalaryDistributionResponse(
        String range,
        long employeeCount
) {
}

