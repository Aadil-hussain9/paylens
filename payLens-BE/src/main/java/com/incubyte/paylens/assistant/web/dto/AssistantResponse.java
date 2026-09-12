package com.incubyte.paylens.assistant.web.dto;

public record AssistantResponse(
        String answer,
        AssistantContext context,
        String relatedAnalyticsLink,
        String status,
        String errorMessage
) {
}
