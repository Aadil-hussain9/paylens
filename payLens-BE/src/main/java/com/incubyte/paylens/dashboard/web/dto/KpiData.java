package com.incubyte.paylens.dashboard.web.dto;

import java.math.BigDecimal;

public record KpiData(
        long totalEmployees,
        BigDecimal totalAnnualPayroll,
        BigDecimal averageSalary,
        long countries
) {
}
