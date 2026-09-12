package com.incubyte.paylens.assistant.repository;

import java.math.BigDecimal;

public record AssistantAggregateResult(
        long employeeCount,
        BigDecimal totalPayroll,
        BigDecimal averageSalary,
        BigDecimal medianSalary,
        BigDecimal p75Salary
) {
}
