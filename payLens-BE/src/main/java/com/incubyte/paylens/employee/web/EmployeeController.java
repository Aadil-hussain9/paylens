package com.incubyte.paylens.employee.web;

import java.util.Locale;

import jakarta.validation.Valid;

import org.springframework.data.domain.Sort;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.incubyte.paylens.common.InvalidEmployeeQueryException;
import com.incubyte.paylens.common.PageResponse;
import com.incubyte.paylens.employee.domain.EmploymentStatus;
import com.incubyte.paylens.employee.service.CompensationService;
import com.incubyte.paylens.employee.service.EmployeeService;
import com.incubyte.paylens.employee.web.dto.EmployeeDetailsResponse;
import com.incubyte.paylens.employee.web.dto.EmployeeSearchCriteria;
import com.incubyte.paylens.employee.web.dto.EmployeeSummaryResponse;
import com.incubyte.paylens.employee.web.dto.UpdateCompensationRequest;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;
    private final CompensationService compensationService;

    public EmployeeController(EmployeeService employeeService, CompensationService compensationService) {
        this.employeeService = employeeService;
        this.compensationService = compensationService;
    }

    @GetMapping
    public PageResponse<EmployeeSummaryResponse> listEmployees(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String jobTitle,
            @RequestParam(required = false) EmploymentStatus employmentStatus,
            @RequestParam(defaultValue = "employeeNumber") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDirection) {

        validatePageSize(pageSize);
        String resolvedSortBy = normalize(sortBy);
        if (!EmployeeService.isSupportedSortField(resolvedSortBy)) {
            throw new InvalidEmployeeQueryException("Unsupported sort field '%s'. Allowed fields: %s".formatted(resolvedSortBy, EmployeeService.supportedSortFields()));
        }

        Sort.Direction resolvedDirection = parseSortDirection(sortDirection);
        String resolvedJobTitle = resolveJobTitleFilter(role, jobTitle);

        EmployeeSearchCriteria criteria = new EmployeeSearchCriteria(
                page,
                pageSize,
                normalize(search),
                normalize(country),
                normalize(department),
                resolvedJobTitle,
                employmentStatus,
                resolvedSortBy,
                resolvedDirection
        );
        return employeeService.listEmployees(criteria);
    }

    @GetMapping("/{id}")
    public EmployeeDetailsResponse getEmployeeById(@PathVariable long id) {
        if (id <= 0) {
            throw new InvalidEmployeeQueryException("Employee id must be greater than 0");
        }
        return employeeService.getEmployeeById(id);
    }

    @PatchMapping("/{id}/compensation")
    public EmployeeDetailsResponse updateEmployeeCompensation(
            @PathVariable long id,
            @Valid @RequestBody UpdateCompensationRequest request) {
        return compensationService.updateCurrentSalary(id, request);
    }

    private void validatePageSize(int pageSize) {
        if (pageSize <= 0) {
            throw new InvalidEmployeeQueryException("pageSize must be greater than 0");
        }
        if (pageSize > EmployeeService.MAX_PAGE_SIZE) {
            throw new InvalidEmployeeQueryException("pageSize must be less than or equal to %d".formatted(EmployeeService.MAX_PAGE_SIZE));
        }
    }

    private Sort.Direction parseSortDirection(String sortDirection) {
        if (!StringUtils.hasText(sortDirection)) {
            return Sort.Direction.ASC;
        }
        try {
            return Sort.Direction.valueOf(sortDirection.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new InvalidEmployeeQueryException("sortDirection must be ASC or DESC");
        }
    }

    private String resolveJobTitleFilter(String role, String jobTitle) {
        String resolvedRole = normalize(role);
        String resolvedJobTitle = normalize(jobTitle);
        if (resolvedRole != null && resolvedJobTitle != null && !resolvedRole.equalsIgnoreCase(resolvedJobTitle)) {
            throw new InvalidEmployeeQueryException("Provide only one of role or jobTitle, or ensure both values match");
        }
        return resolvedJobTitle != null ? resolvedJobTitle : resolvedRole;
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}

