package com.incubyte.paylens.employee.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import com.incubyte.paylens.employee.domain.Employee;
import com.incubyte.paylens.employee.domain.EmploymentStatus;

@SpringBootTest
class EmployeeRepositoryTest {

    @Autowired
    private EmployeeRepository employeeRepository;

    @BeforeEach
    void setUp() {
        employeeRepository.deleteAll();
        employeeRepository.save(new Employee("EMP-00001", "John", "Smith", "Engineer", "Engineering", "India", EmploymentStatus.ACTIVE, new BigDecimal("1000.00"), "INR"));
        employeeRepository.save(new Employee("EMP-00002", "Johnny", "Miller", "Engineer", "Engineering", "India", EmploymentStatus.ACTIVE, new BigDecimal("1100.00"), "INR"));
        employeeRepository.save(new Employee("EMP-00003", "Jane", "Doe", "Analyst", "Finance", "United States", EmploymentStatus.ON_LEAVE, new BigDecimal("2000.00"), "USD"));
        employeeRepository.save(new Employee("EMP-00004", "Bob", "Stone", "Engineer", "Engineering", "Canada", EmploymentStatus.TERMINATED, new BigDecimal("1500.00"), "CAD"));
        employeeRepository.flush();
    }

    @Test
    void shouldFilterSearchPaginateAndSortInDatabase() {
        Page<Employee> page = employeeRepository.findAll(
                EmployeeSpecifications.hasSearchText("john")
                        .and(EmployeeSpecifications.hasCountry("India"))
                        .and(EmployeeSpecifications.hasDepartment("Engineering")),
                PageRequest.of(0, 1, Sort.by(Sort.Direction.ASC, "lastName")));

        assertThat(page.getTotalElements()).isEqualTo(2);
        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getLastName()).isEqualTo("Miller");
    }

    @Test
    void shouldSortBySalaryDescending() {
        Page<Employee> page = employeeRepository.findAll(
                (root, query, criteriaBuilder) -> null, // Match all
                PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "currentSalary")));

        assertThat(page.getContent())
                .extracting(Employee::getCurrentSalary)
                .containsExactly(
                        new BigDecimal("2000.00"),
                        new BigDecimal("1500.00"),
                        new BigDecimal("1100.00"),
                        new BigDecimal("1000.00"));
    }
}




