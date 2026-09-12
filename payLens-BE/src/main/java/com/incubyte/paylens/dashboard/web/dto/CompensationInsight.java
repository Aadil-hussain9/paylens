package com.incubyte.paylens.dashboard.web.dto;

public record CompensationInsight(
        String id,
        String title,
        String description,
        String severity, // 'high', 'medium', 'low'
        String category // 'outlier', 'variation', 'geography'
) {
}
