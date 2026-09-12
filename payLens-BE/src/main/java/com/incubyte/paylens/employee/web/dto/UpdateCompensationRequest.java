package com.incubyte.paylens.employee.web.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import com.incubyte.paylens.employee.domain.SalaryUpdateReason;

public record UpdateCompensationRequest(
        @NotNull(message = "newSalary is required")
        @DecimalMin(value = "0.01", message = "newSalary must be greater than zero")
        BigDecimal newSalary,

        @NotBlank(message = "currency is required")
        String currency,

        @NotNull(message = "reason is required")
        SalaryUpdateReason reason
) {
}

