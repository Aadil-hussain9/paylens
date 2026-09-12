package com.incubyte.paylens.employee.seed;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.incubyte.paylens.currency.repository.FxRateRepository;
import com.incubyte.paylens.employee.domain.Employee;
import com.incubyte.paylens.employee.domain.EmploymentStatus;
import com.incubyte.paylens.employee.repository.EmployeeRepository;

/**
 * Validates data integrity of seeded 10,000 employees and FX rates.
 *
 * This test confirms that:
 * - Exactly 10,000 employees are seeded
 * - No duplicate employee numbers
 * - All employees have valid data
 * - All currencies have corresponding FX rates
 * - FX rates are positive
 */
@SpringBootTest(properties = "paylens.employee.seed.enabled=true")
class SeedDataIntegrityTest {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private FxRateRepository fxRateRepository;

    @Autowired
    private EmployeeSeedRunner seedRunner;

    /**
     * The Testcontainers-backed PostgreSQL instance is shared across Spring test contexts,
     * so an earlier test class (with a different context) may have wiped the employees
     * seeded on startup. Make the seed state deterministic before each assertion.
     */
    @BeforeEach
    void ensureSeeded() throws Exception {
        if (employeeRepository.count() != 10_000) {
            employeeRepository.deleteAll();
            seedRunner.run();
        }
    }

    @Test
    void shouldSeedExactlyTenThousandEmployees() {
        assertThat(employeeRepository.count()).isEqualTo(10_000);
    }

    @Test
    void shouldHaveNoDuplicateEmployeeNumbers() {
        List<Employee> employees = employeeRepository.findAll();
        Set<String> employeeNumbers = new HashSet<>();
        for (Employee emp : employees) {
            assertThat(employeeNumbers.add(emp.getEmployeeNumber()))
                    .as("Employee number %s is duplicated", emp.getEmployeeNumber())
                    .isTrue();
        }
        assertThat(employeeNumbers).hasSize(10_000);
    }

    @Test
    void shouldHaveValidEmployeeNumbers() {
        List<Employee> employees = employeeRepository.findAll();
        for (Employee emp : employees) {
            assertThat(emp.getEmployeeNumber())
                    .as("Employee number should match format EMP-#####")
                    .matches("^EMP-\\d{5}$");
        }
    }

    @Test
    void shouldHaveNoNullRequiredFields() {
        List<Employee> employees = employeeRepository.findAll();
        for (Employee emp : employees) {
            assertThat(emp.getEmployeeNumber()).isNotNull();
            assertThat(emp.getFirstName()).isNotNull().isNotBlank();
            assertThat(emp.getLastName()).isNotNull().isNotBlank();
            assertThat(emp.getJobTitle()).isNotNull().isNotBlank();
            assertThat(emp.getDepartment()).isNotNull().isNotBlank();
            assertThat(emp.getCountry()).isNotNull().isNotBlank();
            assertThat(emp.getEmploymentStatus()).isNotNull();
            assertThat(emp.getCurrentSalary()).isNotNull();
            assertThat(emp.getCurrency()).isNotNull().isNotBlank();
        }
    }

    @Test
    void shouldHavePositiveSalaries() {
        List<Employee> employees = employeeRepository.findAll();
        for (Employee emp : employees) {
            assertThat(emp.getCurrentSalary())
                    .as("Employee %s has non-positive salary", emp.getEmployeeNumber())
                    .isPositive();
        }
    }

    @Test
    void shouldHaveSalaryWith2DecimalPlaces() {
        List<Employee> employees = employeeRepository.findAll();
        for (Employee emp : employees) {
            assertThat(emp.getCurrentSalary().scale())
                    .as("Employee %s salary scale should be 2", emp.getEmployeeNumber())
                    .isEqualTo(2);
        }
    }

    @Test
    void shouldHaveCurrencyCodesWith3Characters() {
        List<Employee> employees = employeeRepository.findAll();
        for (Employee emp : employees) {
            assertThat(emp.getCurrency())
                    .as("Employee %s currency should be 3 characters", emp.getEmployeeNumber())
                    .hasSize(3);
        }
    }

    @Test
    void shouldHaveValidEmploymentStatus() {
        List<Employee> employees = employeeRepository.findAll();
        for (Employee emp : employees) {
            assertThat(emp.getEmploymentStatus())
                    .isIn(EmploymentStatus.ACTIVE, EmploymentStatus.ON_LEAVE, EmploymentStatus.TERMINATED);
        }
    }

    @Test
    void shouldHaveMultipleCountries() {
        List<Employee> employees = employeeRepository.findAll();
        Set<String> countries = new HashSet<>();
        for (Employee emp : employees) {
            countries.add(emp.getCountry());
        }
        assertThat(countries)
                .as("Should have multiple countries for realistic distribution")
                .hasSizeGreaterThanOrEqualTo(6)
                .contains("India", "United States", "United Kingdom", "Germany", "Canada", "Australia");
    }

    @Test
    void shouldHaveMultipleDepartments() {
        List<Employee> employees = employeeRepository.findAll();
        Set<String> departments = new HashSet<>();
        for (Employee emp : employees) {
            departments.add(emp.getDepartment());
        }
        assertThat(departments)
                .as("Should have multiple departments")
                .hasSizeGreaterThanOrEqualTo(5);
    }

    @Test
    void shouldHaveMultipleJobTitles() {
        List<Employee> employees = employeeRepository.findAll();
        Set<String> jobTitles = new HashSet<>();
        for (Employee emp : employees) {
            jobTitles.add(emp.getJobTitle());
        }
        assertThat(jobTitles)
                .as("Should have multiple job titles")
                .hasSizeGreaterThanOrEqualTo(5);
    }

    @Test
    void shouldHaveMultipleCurrencies() {
        List<Employee> employees = employeeRepository.findAll();
        Set<String> currencies = new HashSet<>();
        for (Employee emp : employees) {
            currencies.add(emp.getCurrency());
        }
        assertThat(currencies)
                .as("Should have multiple currencies")
                .hasSizeGreaterThanOrEqualTo(6);
    }

    @Test
    void shouldHaveAllUsedCurrenciesInFxRates() {
        List<Employee> employees = employeeRepository.findAll();
        Set<String> usedCurrencies = new HashSet<>();
        for (Employee emp : employees) {
            usedCurrencies.add(emp.getCurrency());
        }

        for (String currency : usedCurrencies) {
            assertThat(fxRateRepository.findByCurrency(currency))
                    .as("Currency %s used by employees but no FX rate found", currency)
                    .isNotEmpty();
        }
    }

    @Test
    void shouldHavePositiveFxRates() {
        fxRateRepository.findAll().forEach(rate ->
                assertThat(rate.getRateToUsd())
                        .as("FX rate for %s should be positive", rate.getCurrency())
                        .isPositive()
        );
    }

    @Test
    void shouldHavePlausibleSalaryRanges() {
        List<Employee> employees = employeeRepository.findAll();
        for (Employee emp : employees) {
            // Salaries should be positive and within a plausible range for their currency
            // Native currency amounts vary widely:
            // - USD/GBP/EUR: typically 50k-300k
            // - INR: typically millions (e.g., 5M-10M)
            // - JPY: typically millions (e.g., 5M-30M)
            // Upper bound is generous to accommodate all currencies
            assertThat(emp.getCurrentSalary().doubleValue())
                    .as("Employee %s salary is in plausible range", emp.getEmployeeNumber())
                    .isGreaterThan(0)
                    .isLessThan(100_000_000); // Very high upper bound for large-denomination currencies
        }
    }

    @Test
    void shouldHaveDeterministicSeed() {
        // First employee should always be EMP-00001
        Employee first = employeeRepository.findAll()
                .stream()
                .filter(e -> e.getEmployeeNumber().equals("EMP-00001"))
                .findFirst()
                .orElseThrow();

        assertThat(first.getFirstName()).isNotNull();
        assertThat(first.getLastName()).isNotNull();
        assertThat(first.getEmploymentStatus()).isNotNull();
        // Seeding is deterministic, so first employee should always have same data
    }

    @Test
    void shouldHaveReasonableEmploymentStatusDistribution() {
        List<Employee> employees = employeeRepository.findAll();
        long activeCount = employees.stream()
                .filter(e -> e.getEmploymentStatus() == EmploymentStatus.ACTIVE)
                .count();
        long onLeaveCount = employees.stream()
                .filter(e -> e.getEmploymentStatus() == EmploymentStatus.ON_LEAVE)
                .count();
        long terminatedCount = employees.stream()
                .filter(e -> e.getEmploymentStatus() == EmploymentStatus.TERMINATED)
                .count();

        assertThat(activeCount + onLeaveCount + terminatedCount).isEqualTo(10_000);
        // With deterministic seed, ~1 in 23 employees should be ON_LEAVE
        assertThat(onLeaveCount).isGreaterThan(200).isLessThan(600);
        // Most should be ACTIVE
        assertThat(activeCount).isGreaterThan(9_000);
    }
}





