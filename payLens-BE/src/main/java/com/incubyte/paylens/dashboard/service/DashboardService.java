package com.incubyte.paylens.dashboard.service;

import com.incubyte.paylens.dashboard.repository.DashboardRepository;
import com.incubyte.paylens.dashboard.web.dto.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class DashboardService {

    private final DashboardRepository dashboardRepository;

    public DashboardService(DashboardRepository dashboardRepository) {
        this.dashboardRepository = dashboardRepository;
    }

    public DashboardData getDashboardData() {
        KpiData kpis = dashboardRepository.getKpis();
        List<CountryPayroll> payrollByCountry = dashboardRepository.getPayrollByCountry();
        List<DepartmentSalary> salaryByDepartment = dashboardRepository.getSalaryByDepartment();
        List<SalaryBand> salaryDistribution = dashboardRepository.getSalaryBands();

        List<CompensationInsight> insights = generateInsights(kpis, salaryByDepartment, payrollByCountry);

        return new DashboardData(
                kpis,
                salaryDistribution,
                payrollByCountry,
                salaryByDepartment,
                insights
        );
    }

    private List<CompensationInsight> generateInsights(KpiData kpis, List<DepartmentSalary> deptSalaries, List<CountryPayroll> countryPayrolls) {
        List<CompensationInsight> insights = new ArrayList<>();

        // Generate dynamic insights
        if (kpis.averageSalary() != null && !deptSalaries.isEmpty()) {
            DepartmentSalary highestAvgDept = deptSalaries.get(0); // It's ordered by avgSalary DESC
            if (highestAvgDept.avgSalary().doubleValue() > kpis.averageSalary().doubleValue() * 1.5) {
                insights.add(new CompensationInsight(
                        "variation-001",
                        highestAvgDept.department() + " department has significantly higher average salary",
                        highestAvgDept.department() + " averages $" + highestAvgDept.avgSalary().intValue() + 
                        ", which is notably above the company average. This is expected for specialized roles but worth monitoring.",
                        "medium",
                        "variation"
                ));
            }
        }

        if (!countryPayrolls.isEmpty()) {
            CountryPayroll topCountry = countryPayrolls.get(0);
            double percentage = (topCountry.totalPayroll().doubleValue() / kpis.totalAnnualPayroll().doubleValue()) * 100;
            if (percentage > 40) {
                insights.add(new CompensationInsight(
                        "geography-001",
                        topCountry.country() + " payroll accounts for " + String.format("%.0f", percentage) + "% of total compensation",
                        topCountry.country() + " represents " + topCountry.employeeCount() + " of " + kpis.totalEmployees() + 
                        " employees and a large chunk of total annual payroll. Monitor concentration risk.",
                        "low",
                        "geography"
                ));
            }
        }

        if (insights.isEmpty()) {
            insights.add(new CompensationInsight(
                    "general-001",
                    "Compensation aligns with expected variance",
                    "No significant anomalies detected in department or geography compensation distributions.",
                    "low",
                    "variation"
            ));
        }

        return insights;
    }
}
