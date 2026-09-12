package com.incubyte.paylens.employee.repository;

import java.util.Locale;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import com.incubyte.paylens.employee.domain.Employee;
import com.incubyte.paylens.employee.domain.EmploymentStatus;

import jakarta.persistence.criteria.Predicate;

public final class EmployeeSpecifications {

    private EmployeeSpecifications() {
    }

    public static Specification<Employee> hasSearchText(String search) {
        if (!StringUtils.hasText(search)) {
            return null;
        }
        String pattern = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
        return (root, query, criteriaBuilder) -> {
            Predicate employeeNumberMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("employeeNumber")), pattern);
            Predicate firstNameMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("firstName")), pattern);
            Predicate lastNameMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("lastName")), pattern);
            return criteriaBuilder.or(employeeNumberMatch, firstNameMatch, lastNameMatch);
        };
    }

    public static Specification<Employee> hasCountry(String country) {
        return equalsIgnoreCase("country", country);
    }

    public static Specification<Employee> hasDepartment(String department) {
        return equalsIgnoreCase("department", department);
    }

    public static Specification<Employee> hasJobTitle(String jobTitle) {
        return equalsIgnoreCase("jobTitle", jobTitle);
    }

    public static Specification<Employee> hasEmploymentStatus(EmploymentStatus employmentStatus) {
        if (employmentStatus == null) {
            return null;
        }
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(root.get("employmentStatus"), employmentStatus);
    }

    private static Specification<Employee> equalsIgnoreCase(String fieldName, String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return (root, query, criteriaBuilder) -> criteriaBuilder.equal(criteriaBuilder.lower(root.get(fieldName)), normalized);
    }
}



