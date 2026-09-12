package com.incubyte.paylens.analytics.web.dto;

import java.math.BigDecimal;

public record SalaryRangeResponse(
        BigDecimal min,
        BigDecimal p25,
        BigDecimal median,
        BigDecimal p75,
        BigDecimal max,
        String currency
) {
}
