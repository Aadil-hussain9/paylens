package com.incubyte.paylens.employee.web.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import com.incubyte.paylens.employee.domain.SalaryUpdateReason;

/**
 * Payload for {@code PATCH /api/employees/{id}/compensation}.
 *
 * <p><b>MVP scope note — the {@code reason} field is accepted as part of the HR update
 * request but is intentionally <i>not persisted</i>.</b> Salary history / audit logging is
 * explicitly out of scope for this assessment (see {@code docs/architecture-decisions.md}
 * and the README). We keep {@code reason} in the contract so that:
 * <ul>
 *   <li>the UI and API stay aligned with a real HR workflow;</li>
 *   <li>adding an audit table later is a purely additive change (no API rewrite).</li>
 * </ul>
 */
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

