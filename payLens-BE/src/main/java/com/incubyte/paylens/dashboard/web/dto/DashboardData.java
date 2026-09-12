package com.incubyte.paylens.dashboard.web.dto;

import java.util.List;

public record DashboardData(
        KpiData kpis,
        List<SalaryBand> salaryDistribution,
        List<CountryPayroll> payrollByCountry,
        List<DepartmentSalary> salaryByDepartment,
        List<CompensationInsight> insights
) {
}
