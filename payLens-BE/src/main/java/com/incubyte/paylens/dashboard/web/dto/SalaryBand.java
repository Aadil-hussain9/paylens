package com.incubyte.paylens.dashboard.web.dto;

public record SalaryBand(
        String label,
        long min,
        Long max, // Can be null for max (Infinity)
        long employeeCount
) {
}
