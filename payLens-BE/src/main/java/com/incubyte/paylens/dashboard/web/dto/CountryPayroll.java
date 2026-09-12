package com.incubyte.paylens.dashboard.web.dto;

import java.math.BigDecimal;

public record CountryPayroll(
        String country,
        String countryCode,
        long employeeCount,
        BigDecimal totalPayroll
) {
}
