package com.incubyte.paylens.employee.service;

import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.incubyte.paylens.common.EmployeeNotFoundException;
import com.incubyte.paylens.common.InvalidEmployeeQueryException;
import com.incubyte.paylens.common.PageResponse;
import com.incubyte.paylens.employee.domain.Employee;
import com.incubyte.paylens.employee.repository.EmployeeRepository;
import com.incubyte.paylens.employee.repository.EmployeeSpecifications;
import com.incubyte.paylens.employee.web.dto.EmployeeDetailsResponse;
import com.incubyte.paylens.employee.web.dto.EmployeeSearchCriteria;
import com.incubyte.paylens.employee.web.dto.EmployeeSummaryResponse;

@Service
@Transactional(readOnly = true)
public class EmployeeService {

    public static final int MAX_PAGE_SIZE = 200;
    private static final String DEFAULT_SORT_FIELD = "employeeNumber";
    private static final Sort.Direction DEFAULT_SORT_DIRECTION = Sort.Direction.ASC;
    private static final Map<String, String> SORT_FIELD_MAPPING = Map.of(
            "employeeNumber", "employeeNumber",
            "firstName", "firstName",
            "lastName", "lastName",
            "department", "department",
            "country", "country",
            "jobTitle", "jobTitle",
            "currentSalary", "currentSalary"
    );

    private final EmployeeRepository employeeRepository;

    public EmployeeService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    public PageResponse<EmployeeSummaryResponse> listEmployees(EmployeeSearchCriteria criteria) {
        Pageable pageable = buildPageable(criteria.page(), criteria.pageSize(), criteria.sortBy(), criteria.sortDirection());
        Specification<Employee> specification = buildSpecification(criteria);
        Page<Employee> employeePage = employeeRepository.findAll(specification, pageable);
        List<EmployeeSummaryResponse> content = employeePage.map(this::toSummaryResponse).getContent();
        return new PageResponse<>(content, employeePage.getNumber(), employeePage.getSize(), employeePage.getTotalElements(), employeePage.getTotalPages());
    }

    public EmployeeDetailsResponse getEmployeeById(long id) {
        if (id <= 0) {
            throw new InvalidEmployeeQueryException("Employee id must be greater than 0");
        }
        Employee employee = employeeRepository.findById(id).orElseThrow(() -> new EmployeeNotFoundException(id));
        return toDetailsResponse(employee);
    }

    public static boolean isSupportedSortField(String sortBy) {
        return StringUtils.hasText(sortBy) && SORT_FIELD_MAPPING.containsKey(sortBy.trim());
    }

    public static List<String> supportedSortFields() {
        return List.copyOf(SORT_FIELD_MAPPING.keySet());
    }

    private Pageable buildPageable(int page, int pageSize, String sortBy, Sort.Direction sortDirection) {
        if (page < 0) {
            throw new InvalidEmployeeQueryException("page must be greater than or equal to 0");
        }
        if (pageSize <= 0) {
            throw new InvalidEmployeeQueryException("pageSize must be greater than 0");
        }
        if (pageSize > MAX_PAGE_SIZE) {
            throw new InvalidEmployeeQueryException("pageSize must be less than or equal to %d".formatted(MAX_PAGE_SIZE));
        }

        String resolvedSortBy = StringUtils.hasText(sortBy) ? sortBy.trim() : DEFAULT_SORT_FIELD;
        if (!isSupportedSortField(resolvedSortBy)) {
            throw new InvalidEmployeeQueryException("Unsupported sort field '%s'. Allowed fields: %s".formatted(resolvedSortBy, supportedSortFields()));
        }

        Sort.Direction resolvedDirection = sortDirection == null ? DEFAULT_SORT_DIRECTION : sortDirection;
        String entityField = SORT_FIELD_MAPPING.get(resolvedSortBy);
        return PageRequest.of(page, pageSize, Sort.by(resolvedDirection, entityField));
    }

    private Specification<Employee> buildSpecification(EmployeeSearchCriteria criteria) {
        Specification<Employee> specification = null;
        specification = combine(specification, EmployeeSpecifications.hasSearchText(criteria.search()));
        specification = combine(specification, EmployeeSpecifications.hasCountry(criteria.country()));
        specification = combine(specification, EmployeeSpecifications.hasDepartment(criteria.department()));
        specification = combine(specification, EmployeeSpecifications.hasJobTitle(criteria.jobTitle()));
        specification = combine(specification, EmployeeSpecifications.hasEmploymentStatus(criteria.employmentStatus()));
        return specification;
    }

    private Specification<Employee> combine(Specification<Employee> current, Specification<Employee> next) {
        if (next == null) {
            return current;
        }
        return current == null ? next : current.and(next);
    }

    private EmployeeSummaryResponse toSummaryResponse(Employee employee) {
        return new EmployeeSummaryResponse(
                employee.getId(),
                employee.getEmployeeNumber(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getJobTitle(),
                employee.getDepartment(),
                employee.getCountry(),
                employee.getEmploymentStatus()
        );
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


