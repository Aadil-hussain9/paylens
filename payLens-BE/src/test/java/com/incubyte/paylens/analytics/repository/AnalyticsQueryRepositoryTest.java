package com.incubyte.paylens.analytics.repository;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.incubyte.paylens.analytics.web.dto.AnalyticsFilter;
import com.incubyte.paylens.employee.domain.Employee;
import com.incubyte.paylens.employee.domain.EmploymentStatus;
import com.incubyte.paylens.employee.repository.EmployeeRepository;

@SpringBootTest
class AnalyticsQueryRepositoryTest {

    @Autowired
    private AnalyticsQueryRepository analyticsQueryRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @BeforeEach
    void setUp() {
        employeeRepository.deleteAll();
    }

    @Test
    void shouldCalculateSummaryUsingUsdNormalizedSalaries() {
        employeeRepository.save(employee("EMP-1", "United States", "Engineering", "Software Engineer", "1000.00", "USD"));
        employeeRepository.save(employee("EMP-2", "India", "Engineering", "Software Engineer", "100000.00", "INR"));

        AnalyticsSummaryProjection summary = analyticsQueryRepository.fetchSummary(new AnalyticsFilter(null, null, null));

        assertThat(summary.totalEmployees()).isEqualTo(2);
        assertThat(summary.totalPayroll()).isEqualByComparingTo("2204.82");
        assertThat(summary.averageSalary()).isEqualByComparingTo("1102.41");
        assertThat(summary.medianSalary()).isEqualByComparingTo("1102.41");
    }

    @Test
    void shouldCalculateMedianForOddDataset() {
        employeeRepository.save(employee("EMP-1", "United States", "Engineering", "Software Engineer", "1000.00", "USD"));
        employeeRepository.save(employee("EMP-2", "United States", "Engineering", "Software Engineer", "2000.00", "USD"));
        employeeRepository.save(employee("EMP-3", "United States", "Engineering", "Software Engineer", "3000.00", "USD"));
        employeeRepository.save(employee("EMP-4", "United States", "Engineering", "Software Engineer", "4000.00", "USD"));
        employeeRepository.save(employee("EMP-5", "United States", "Engineering", "Software Engineer", "5000.00", "USD"));

        AnalyticsSummaryProjection summary = analyticsQueryRepository.fetchSummary(new AnalyticsFilter(null, null, null));

        assertThat(summary.medianSalary()).isEqualByComparingTo("3000.00");
    }

    @Test
    void shouldCalculateMedianForEvenDatasetWithInterpolation() {
        employeeRepository.save(employee("EMP-1", "United States", "Engineering", "Software Engineer", "1000.00", "USD"));
        employeeRepository.save(employee("EMP-2", "United States", "Engineering", "Software Engineer", "2000.00", "USD"));
        employeeRepository.save(employee("EMP-3", "United States", "Engineering", "Software Engineer", "3000.00", "USD"));
        employeeRepository.save(employee("EMP-4", "United States", "Engineering", "Software Engineer", "4000.00", "USD"));

        AnalyticsSummaryProjection summary = analyticsQueryRepository.fetchSummary(new AnalyticsFilter(null, null, null));

        assertThat(summary.medianSalary()).isEqualByComparingTo("2500.00");
    }

    @Test
    void shouldApplyComposableFilters() {
        employeeRepository.save(employee("EMP-1", "India", "Engineering", "Senior Software Engineer", "5000.00", "USD"));
        employeeRepository.save(employee("EMP-2", "India", "Engineering", "Software Engineer", "3000.00", "USD"));
        employeeRepository.save(employee("EMP-3", "India", "Finance", "Senior Software Engineer", "4000.00", "USD"));

        AnalyticsSummaryProjection summary = analyticsQueryRepository.fetchSummary(
                new AnalyticsFilter("India", "Engineering", "Senior Software Engineer"));

        assertThat(summary.totalEmployees()).isEqualTo(1);
        assertThat(summary.totalPayroll()).isEqualByComparingTo("5000.00");
    }

    @Test
    void shouldReturnGroupedCountryAnalytics() {
        employeeRepository.save(employee("EMP-1", "India", "Engineering", "Software Engineer", "1000.00", "USD"));
        employeeRepository.save(employee("EMP-2", "India", "Engineering", "Software Engineer", "2000.00", "USD"));
        employeeRepository.save(employee("EMP-3", "Canada", "Engineering", "Software Engineer", "500.00", "USD"));

        List<AnalyticsGroupProjection> rows = analyticsQueryRepository.fetchByCountry(new AnalyticsFilter(null, null, null));

        assertThat(rows).hasSize(2);
        assertThat(rows.get(0).groupValue()).isEqualTo("India");
        assertThat(rows.get(0).employeeCount()).isEqualTo(2);
        assertThat(rows.get(0).totalPayroll()).isEqualByComparingTo("3000.00");
    }

    @Test
    void shouldReturnSalaryDistributionInUsdBuckets() {
        employeeRepository.save(employee("EMP-1", "India", "Engineering", "Software Engineer", "40000.00", "USD"));
        employeeRepository.save(employee("EMP-2", "India", "Engineering", "Software Engineer", "75000.00", "USD"));
        employeeRepository.save(employee("EMP-3", "India", "Engineering", "Software Engineer", "125000.00", "USD"));
        employeeRepository.save(employee("EMP-4", "India", "Engineering", "Software Engineer", "260000.00", "USD"));

        List<SalaryDistributionProjection> distribution = analyticsQueryRepository
                .fetchSalaryDistribution(new AnalyticsFilter(null, null, null));

        assertThat(distribution).hasSize(5);
        assertThat(distribution).extracting(SalaryDistributionProjection::range)
                .containsExactly("0-50K", "50K-100K", "100K-150K", "150K-200K", "200K+");
        assertThat(distribution).extracting(SalaryDistributionProjection::employeeCount)
                .containsExactly(1L, 1L, 1L, 0L, 1L);
    }

    @Test
    void shouldReturnZerosWhenNoEmployeesMatchFilter() {
        AnalyticsSummaryProjection summary = analyticsQueryRepository.fetchSummary(new AnalyticsFilter("India", null, null));
        List<AnalyticsGroupProjection> byCountry = analyticsQueryRepository.fetchByCountry(new AnalyticsFilter("India", null, null));

        assertThat(summary.totalEmployees()).isZero();
        assertThat(summary.totalPayroll()).isEqualByComparingTo("0.00");
        assertThat(summary.averageSalary()).isEqualByComparingTo("0.00");
        assertThat(summary.medianSalary()).isEqualByComparingTo("0.00");
        assertThat(byCountry).isEmpty();
    }

    private Employee employee(
            String employeeNumber,
            String country,
            String department,
            String jobTitle,
            String salary,
            String currency) {
        return new Employee(
                employeeNumber,
                "First",
                "Last",
                jobTitle,
                department,
                country,
                EmploymentStatus.ACTIVE,
                new BigDecimal(salary),
                currency);
    }
}


