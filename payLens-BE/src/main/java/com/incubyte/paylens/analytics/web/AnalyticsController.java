package com.incubyte.paylens.analytics.web;

import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.incubyte.paylens.analytics.service.AnalyticsService;
import com.incubyte.paylens.analytics.web.dto.AnalyticsFilter;
import com.incubyte.paylens.analytics.web.dto.AnalyticsSummaryResponse;
import com.incubyte.paylens.analytics.web.dto.CountryAnalyticsResponse;
import com.incubyte.paylens.analytics.web.dto.DepartmentAnalyticsResponse;
import com.incubyte.paylens.analytics.web.dto.RoleAnalyticsResponse;
import com.incubyte.paylens.analytics.web.dto.SalaryDistributionResponse;
import com.incubyte.paylens.common.InvalidEmployeeQueryException;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/summary")
    public AnalyticsSummaryResponse getSummary(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String jobTitle) {
        return analyticsService.getSummary(buildFilter(country, department, role, jobTitle));
    }

    @GetMapping("/salary-distribution")
    public List<SalaryDistributionResponse> getSalaryDistribution(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String jobTitle) {
        return analyticsService.getSalaryDistribution(buildFilter(country, department, role, jobTitle));
    }

    @GetMapping("/salary-ranges")
    public com.incubyte.paylens.analytics.web.dto.SalaryRangeResponse getSalaryRanges(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String jobTitle) {
        return analyticsService.getSalaryRange(buildFilter(country, department, role, jobTitle));
    }

    @GetMapping("/by-country")
    public List<CountryAnalyticsResponse> getByCountry(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String jobTitle) {
        return analyticsService.getByCountry(buildFilter(country, department, role, jobTitle));
    }

    @GetMapping("/by-department")
    public List<DepartmentAnalyticsResponse> getByDepartment(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String jobTitle) {
        return analyticsService.getByDepartment(buildFilter(country, department, role, jobTitle));
    }

    @GetMapping("/by-role")
    public List<RoleAnalyticsResponse> getByRole(
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String jobTitle) {
        return analyticsService.getByRole(buildFilter(country, department, role, jobTitle));
    }

    private AnalyticsFilter buildFilter(String country, String department, String role, String jobTitle) {
        String resolvedCountry = normalize(country);
        String resolvedDepartment = normalize(department);
        String resolvedJobTitle = resolveJobTitleFilter(role, jobTitle);
        return new AnalyticsFilter(resolvedCountry, resolvedDepartment, resolvedJobTitle);
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

