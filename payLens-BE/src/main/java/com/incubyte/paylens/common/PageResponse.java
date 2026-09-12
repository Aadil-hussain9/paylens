package com.incubyte.paylens.common;

import java.util.List;

public record PageResponse<T>(
        List<T> content,
        int page,
        int pageSize,
        long totalElements,
        int totalPages
) {
}

