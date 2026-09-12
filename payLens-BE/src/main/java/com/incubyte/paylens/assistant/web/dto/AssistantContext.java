package com.incubyte.paylens.assistant.web.dto;

public record AssistantContext(
        long employeesAnalyzed,
        String department,
        String country,
        String metric,
        String reportingCurrency,
        String timestamp
) {
}
