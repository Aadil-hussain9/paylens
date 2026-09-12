package com.incubyte.paylens.common;

import java.time.OffsetDateTime;
import java.util.List;

public record ApiError(
        OffsetDateTime timestamp,
        int status,
        String error,
        String code,
        String message,
        List<String> details
) {
}

