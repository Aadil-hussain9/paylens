package com.incubyte.paylens.analytics.service;

import java.util.List;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.incubyte.paylens.analytics.repository.AnalyticsQueryRepository;
import com.incubyte.paylens.analytics.repository.AnalyticsSummaryProjection;
import com.incubyte.paylens.analytics.web.dto.AnalyticsFilter;
import com.incubyte.paylens.analytics.web.dto.AnalyticsSummaryResponse;
import com.incubyte.paylens.analytics.web.dto.CountryAnalyticsResponse;
import com.incubyte.paylens.analytics.web.dto.DepartmentAnalyticsResponse;
import com.incubyte.paylens.analytics.web.dto.RoleAnalyticsResponse;
import com.incubyte.paylens.analytics.web.dto.SalaryDistributionResponse;

@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    private final AnalyticsQueryRepository analyticsQueryRepository;
    private final String reportingCurrency;

    public AnalyticsService(
            AnalyticsQueryRepository analyticsQueryRepository,
            @Value("${paylens.analytics.reporting-currency:USD}") String reportingCurrency) {
        this.analyticsQueryRepository = analyticsQueryRepository;
        this.reportingCurrency = reportingCurrency.toUpperCase(Locale.ROOT);
    }

    public AnalyticsSummaryResponse getSummary(AnalyticsFilter filter) {
        AnalyticsSummaryProjection result = analyticsQueryRepository.fetchSummary(filter);
        return new AnalyticsSummaryResponse(
                result.totalEmployees(),
                result.totalPayroll(),
                result.averageSalary(),
                result.medianSalary(),
                reportingCurrency);
    }

    public com.incubyte.paylens.analytics.web.dto.SalaryRangeResponse getSalaryRange(AnalyticsFilter filter) {
        com.incubyte.paylens.analytics.repository.AnalyticsSalaryRangeProjection result = analyticsQueryRepository.fetchSalaryRange(filter);
        return new com.incubyte.paylens.analytics.web.dto.SalaryRangeResponse(
                result.minSalary(),
                result.p25Salary(),
                result.medianSalary(),
                result.p75Salary(),
                result.maxSalary(),
                reportingCurrency);
    }

    public List<SalaryDistributionResponse> getSalaryDistribution(AnalyticsFilter filter) {
        return analyticsQueryRepository.fetchSalaryDistribution(filter).stream()
                .map(row -> new SalaryDistributionResponse(row.range(), row.employeeCount()))
                .toList();
    }

    public List<CountryAnalyticsResponse> getByCountry(AnalyticsFilter filter) {
        return analyticsQueryRepository.fetchByCountry(filter).stream()
                .map(row -> new CountryAnalyticsResponse(
                        row.groupValue(),
                        row.employeeCount(),
                        row.totalPayroll(),
                        row.averageSalary(),
                        row.medianSalary(),
                        reportingCurrency))
                .toList();
    }

    public List<DepartmentAnalyticsResponse> getByDepartment(AnalyticsFilter filter) {
        return analyticsQueryRepository.fetchByDepartment(filter).stream()
                .map(row -> new DepartmentAnalyticsResponse(
                        row.groupValue(),
                        row.employeeCount(),
                        row.totalPayroll(),
                        row.averageSalary(),
                        row.medianSalary(),
                        reportingCurrency))
                .toList();
    }

    public List<RoleAnalyticsResponse> getByRole(AnalyticsFilter filter) {
        return analyticsQueryRepository.fetchByRole(filter).stream()
                .map(row -> new RoleAnalyticsResponse(
                        row.groupValue(),
                        row.employeeCount(),
                        row.totalPayroll(),
                        row.averageSalary(),
                        row.medianSalary(),
                        reportingCurrency))
                .toList();
    }
}

