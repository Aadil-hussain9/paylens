package com.incubyte.paylens.employee.service;

import java.math.BigDecimal;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.incubyte.paylens.common.EmployeeNotFoundException;
import com.incubyte.paylens.common.InvalidEmployeeQueryException;
import com.incubyte.paylens.currency.repository.FxRateRepository;
import com.incubyte.paylens.employee.domain.Employee;
import com.incubyte.paylens.employee.repository.EmployeeRepository;
import com.incubyte.paylens.employee.web.dto.EmployeeDetailsResponse;
import com.incubyte.paylens.employee.web.dto.UpdateCompensationRequest;

@Service
public class CompensationService {

    private final EmployeeRepository employeeRepository;
    private final FxRateRepository fxRateRepository;

    public CompensationService(EmployeeRepository employeeRepository, FxRateRepository fxRateRepository) {
        this.employeeRepository = employeeRepository;
        this.fxRateRepository = fxRateRepository;
    }

    @Transactional
    public EmployeeDetailsResponse updateCurrentSalary(long employeeId, UpdateCompensationRequest request) {
        if (employeeId <= 0) {
            throw new InvalidEmployeeQueryException("Employee id must be greater than 0");
        }

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new EmployeeNotFoundException(employeeId));

        validateRequest(request);

        String normalizedCurrency = request.currency().trim().toUpperCase(Locale.ROOT);
        employee.updateCurrentCompensation(request.newSalary(), normalizedCurrency);

        Employee saved = employeeRepository.save(employee);
        return toDetailsResponse(saved);
    }

    private void validateRequest(UpdateCompensationRequest request) {
        if (request.newSalary() == null || request.newSalary().compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidEmployeeQueryException("newSalary must be greater than zero");
        }
        if (!StringUtils.hasText(request.currency())) {
            throw new InvalidEmployeeQueryException("currency is required");
        }
        if (request.reason() == null) {
            throw new InvalidEmployeeQueryException("reason is required");
        }

        String normalizedCurrency = request.currency().trim().toUpperCase(Locale.ROOT);
        if (fxRateRepository.findByCurrency(normalizedCurrency).isEmpty()) {
            throw new InvalidEmployeeQueryException("Unsupported currency '%s'".formatted(request.currency()));
        }
    }

    private EmployeeDetailsResponse toDetailsResponse(Employee employee) {
        return new EmployeeDetailsResponse(
                employee.getId(),
                employee.getEmployeeNumber(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getJobTitle(),
                employee.getDepartment(),
                employee.getCountry(),
                employee.getEmploymentStatus(),
                employee.getCurrentSalary(),
                employee.getCurrency()
        );
    }
}

