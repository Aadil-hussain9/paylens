package com.incubyte.paylens.analytics.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.incubyte.paylens.analytics.repository.AnalyticsGroupProjection;
import com.incubyte.paylens.analytics.repository.AnalyticsQueryRepository;
import com.incubyte.paylens.analytics.repository.AnalyticsSummaryProjection;
import com.incubyte.paylens.analytics.repository.SalaryDistributionProjection;
import com.incubyte.paylens.analytics.web.dto.AnalyticsFilter;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private AnalyticsQueryRepository analyticsQueryRepository;

    private AnalyticsService analyticsService;

    @BeforeEach
    void setUp() {
        analyticsService = new AnalyticsService(analyticsQueryRepository, "USD");
    }

    @Test
    void shouldReturnSummary() {
        when(analyticsQueryRepository.fetchSummary(new AnalyticsFilter("India", "Engineering", "Senior Software Engineer")))
                .thenReturn(new AnalyticsSummaryProjection(
                        2,
                        new BigDecimal("2200.00"),
                        new BigDecimal("1100.00"),
                        new BigDecimal("1100.00")));

        var response = analyticsService.getSummary(new AnalyticsFilter("India", "Engineering", "Senior Software Engineer"));

        assertThat(response.totalEmployees()).isEqualTo(2);
        assertThat(response.totalPayroll()).isEqualByComparingTo("2200.00");
        assertThat(response.averageSalary()).isEqualByComparingTo("1100.00");
        assertThat(response.medianSalary()).isEqualByComparingTo("1100.00");
        assertThat(response.reportingCurrency()).isEqualTo("USD");
    }

    @Test
    void shouldHandleEmptySummaryWithZeros() {
        when(analyticsQueryRepository.fetchSummary(new AnalyticsFilter(null, null, null)))
                .thenReturn(new AnalyticsSummaryProjection(
                        0,
                        new BigDecimal("0.00"),
                        new BigDecimal("0.00"),
                        new BigDecimal("0.00")));

        var response = analyticsService.getSummary(new AnalyticsFilter(null, null, null));

        assertThat(response.totalEmployees()).isZero();
        assertThat(response.totalPayroll()).isEqualByComparingTo("0.00");
        assertThat(response.averageSalary()).isEqualByComparingTo("0.00");
        assertThat(response.medianSalary()).isEqualByComparingTo("0.00");
    }

    @Test
    void shouldPassComposableFiltersToRepository() {
        AnalyticsFilter filter = new AnalyticsFilter("India", "Engineering", "Senior Software Engineer");
        when(analyticsQueryRepository.fetchSummary(filter))
                .thenReturn(new AnalyticsSummaryProjection(0, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));

        analyticsService.getSummary(filter);

        ArgumentCaptor<AnalyticsFilter> captor = ArgumentCaptor.forClass(AnalyticsFilter.class);
        verify(analyticsQueryRepository).fetchSummary(captor.capture());
        assertThat(captor.getValue().country()).isEqualTo("India");
        assertThat(captor.getValue().department()).isEqualTo("Engineering");
        assertThat(captor.getValue().jobTitle()).isEqualTo("Senior Software Engineer");
    }

    @Test
    void shouldMapSalaryDistribution() {
        AnalyticsFilter filter = new AnalyticsFilter(null, null, null);
        when(analyticsQueryRepository.fetchSalaryDistribution(filter)).thenReturn(List.of(
                new SalaryDistributionProjection("0-50K", 1),
                new SalaryDistributionProjection("50K-100K", 2)));

        var response = analyticsService.getSalaryDistribution(filter);

        assertThat(response).hasSize(2);
        assertThat(response.get(0).range()).isEqualTo("0-50K");
        assertThat(response.get(0).employeeCount()).isEqualTo(1);
    }

    @Test
    void shouldMapCountryGroupedAnalytics() {
        AnalyticsFilter filter = new AnalyticsFilter(null, "Engineering", null);
        when(analyticsQueryRepository.fetchByCountry(filter)).thenReturn(List.of(
                new AnalyticsGroupProjection("India", 2, new BigDecimal("2200.00"), new BigDecimal("1100.00"), new BigDecimal("1100.00"))));

        var response = analyticsService.getByCountry(filter);

        assertThat(response).hasSize(1);
        assertThat(response.get(0).country()).isEqualTo("India");
        assertThat(response.get(0).reportingCurrency()).isEqualTo("USD");
    }

    @Test
    void shouldMapDepartmentGroupedAnalytics() {
        AnalyticsFilter filter = new AnalyticsFilter("India", null, null);
        when(analyticsQueryRepository.fetchByDepartment(filter)).thenReturn(List.of(
                new AnalyticsGroupProjection("Engineering", 2, new BigDecimal("2200.00"), new BigDecimal("1100.00"), new BigDecimal("1100.00"))));

        var response = analyticsService.getByDepartment(filter);

        assertThat(response).hasSize(1);
        assertThat(response.get(0).department()).isEqualTo("Engineering");
    }

    @Test
    void shouldMapRoleGroupedAnalytics() {
        AnalyticsFilter filter = new AnalyticsFilter("India", "Engineering", null);
        when(analyticsQueryRepository.fetchByRole(filter)).thenReturn(List.of(
                new AnalyticsGroupProjection("Senior Software Engineer", 2, new BigDecimal("2200.00"), new BigDecimal("1100.00"), new BigDecimal("1100.00"))));

        var response = analyticsService.getByRole(filter);

        assertThat(response).hasSize(1);
        assertThat(response.get(0).jobTitle()).isEqualTo("Senior Software Engineer");
    }
}


