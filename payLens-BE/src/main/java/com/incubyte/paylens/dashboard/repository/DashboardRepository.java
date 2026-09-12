package com.incubyte.paylens.dashboard.repository;

import com.incubyte.paylens.dashboard.web.dto.CountryPayroll;
import com.incubyte.paylens.dashboard.web.dto.DepartmentSalary;
import com.incubyte.paylens.dashboard.web.dto.KpiData;
import com.incubyte.paylens.dashboard.web.dto.SalaryBand;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public class DashboardRepository {

    private final JdbcClient jdbcClient;

    public DashboardRepository(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    public KpiData getKpis() {
        return jdbcClient.sql("""
                SELECT 
                    COUNT(*) as totalEmployees,
                    COALESCE(SUM(current_salary), 0) as totalAnnualPayroll,
                    COALESCE(AVG(current_salary), 0) as averageSalary,
                    COUNT(DISTINCT country) as countries
                FROM employee
                """)
                .query((rs, rowNum) -> new KpiData(
                        rs.getLong("totalEmployees"),
                        rs.getBigDecimal("totalAnnualPayroll"),
                        rs.getBigDecimal("averageSalary"),
                        rs.getLong("countries")
                ))
                .single();
    }

    public List<CountryPayroll> getPayrollByCountry() {
        return jdbcClient.sql("""
                SELECT 
                    country,
                    country as countryCode,
                    COUNT(*) as employeeCount,
                    COALESCE(SUM(current_salary), 0) as totalPayroll
                FROM employee
                GROUP BY country
                ORDER BY totalPayroll DESC
                """)
                .query((rs, rowNum) -> new CountryPayroll(
                        rs.getString("country"),
                        rs.getString("countryCode"),
                        rs.getLong("employeeCount"),
                        rs.getBigDecimal("totalPayroll")
                ))
                .list();
    }

    public List<DepartmentSalary> getSalaryByDepartment() {
        return jdbcClient.sql("""
                SELECT 
                    department,
                    COALESCE(MIN(current_salary), 0) as minSalary,
                    COALESCE(AVG(current_salary), 0) as avgSalary,
                    COALESCE(MAX(current_salary), 0) as maxSalary,
                    COUNT(*) as employeeCount
                FROM employee
                GROUP BY department
                ORDER BY avgSalary DESC
                """)
                .query((rs, rowNum) -> new DepartmentSalary(
                        rs.getString("department"),
                        rs.getBigDecimal("minSalary"),
                        rs.getBigDecimal("avgSalary"),
                        rs.getBigDecimal("maxSalary"),
                        rs.getLong("employeeCount")
                ))
                .list();
    }

    public List<SalaryBand> getSalaryBands() {
        // We will fetch raw counts for bands and then assemble them in java or directly as DTOs.
        // It's easier to just write the 6 bands requested in a single row query.
        return jdbcClient.sql("""
                SELECT 
                    COUNT(CASE WHEN current_salary < 30000 THEN 1 END) as b1,
                    COUNT(CASE WHEN current_salary >= 30000 AND current_salary < 50000 THEN 1 END) as b2,
                    COUNT(CASE WHEN current_salary >= 50000 AND current_salary < 70000 THEN 1 END) as b3,
                    COUNT(CASE WHEN current_salary >= 70000 AND current_salary < 90000 THEN 1 END) as b4,
                    COUNT(CASE WHEN current_salary >= 90000 AND current_salary < 120000 THEN 1 END) as b5,
                    COUNT(CASE WHEN current_salary >= 120000 THEN 1 END) as b6
                FROM employee
                """)
                .query((rs, rowNum) -> List.of(
                        new SalaryBand("< $30K", 0, 30000L, rs.getLong("b1")),
                        new SalaryBand("$30K-$50K", 30000, 50000L, rs.getLong("b2")),
                        new SalaryBand("$50K-$70K", 50000, 70000L, rs.getLong("b3")),
                        new SalaryBand("$70K-$90K", 70000, 90000L, rs.getLong("b4")),
                        new SalaryBand("$90K-$120K", 90000, 120000L, rs.getLong("b5")),
                        new SalaryBand("$120K+", 120000, null, rs.getLong("b6"))
                ))
                .single();
    }
}
