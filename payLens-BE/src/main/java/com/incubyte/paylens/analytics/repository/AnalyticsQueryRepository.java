package com.incubyte.paylens.analytics.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import com.incubyte.paylens.analytics.web.dto.AnalyticsFilter;

@Repository
public class AnalyticsQueryRepository {

    private static final String FILTER_CLAUSE = """
            WHERE (CAST(:country AS text) IS NULL OR LOWER(e.country) = LOWER(CAST(:country AS text)))
              AND (CAST(:department AS text) IS NULL OR LOWER(e.department) = LOWER(CAST(:department AS text)))
              AND (CAST(:jobTitle AS text) IS NULL OR LOWER(e.job_title) = LOWER(CAST(:jobTitle AS text)))
            """;

    private static final String SUMMARY_SQL = """
            SELECT
                COUNT(*) AS total_employees,
                COALESCE(SUM(e.current_salary / fx.rate_to_usd), 0)::numeric(19,2) AS total_payroll,
                COALESCE(AVG(e.current_salary / fx.rate_to_usd), 0)::numeric(19,2) AS average_salary,
                COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (e.current_salary / fx.rate_to_usd)), 0)::numeric(19,2) AS median_salary
            FROM employee e
            JOIN fx_rate fx ON fx.currency = e.currency
            """ + FILTER_CLAUSE;

    private static final String DISTRIBUTION_SQL = """
            WITH buckets AS (
                SELECT * FROM (VALUES
                    (1, '0-50K'),
                    (2, '50K-100K'),
                    (3, '100K-150K'),
                    (4, '150K-200K'),
                    (5, '200K+')
                ) AS b(bucket_order, range_label)
            ),
            filtered AS (
                SELECT (e.current_salary / fx.rate_to_usd) AS usd_salary
                FROM employee e
                JOIN fx_rate fx ON fx.currency = e.currency
            """ + FILTER_CLAUSE + """
            ),
            counts AS (
                SELECT
                    CASE
                        WHEN usd_salary < 50000 THEN 1
                        WHEN usd_salary < 100000 THEN 2
                        WHEN usd_salary < 150000 THEN 3
                        WHEN usd_salary < 200000 THEN 4
                        ELSE 5
                    END AS bucket_order,
                    COUNT(*) AS employee_count
                FROM filtered
                GROUP BY 1
            )
            SELECT b.range_label, COALESCE(c.employee_count, 0) AS employee_count
            FROM buckets b
            LEFT JOIN counts c ON c.bucket_order = b.bucket_order
            ORDER BY b.bucket_order
            """;

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public AnalyticsQueryRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public AnalyticsSummaryProjection fetchSummary(AnalyticsFilter filter) {
        return jdbcTemplate.queryForObject(
                SUMMARY_SQL,
                parameters(filter),
                (rs, rowNum) -> new AnalyticsSummaryProjection(
                        rs.getLong("total_employees"),
                        rs.getBigDecimal("total_payroll"),
                        rs.getBigDecimal("average_salary"),
                        rs.getBigDecimal("median_salary")));
    }

    public List<SalaryDistributionProjection> fetchSalaryDistribution(AnalyticsFilter filter) {
        return jdbcTemplate.query(
                DISTRIBUTION_SQL,
                parameters(filter),
                (rs, rowNum) -> new SalaryDistributionProjection(
                        rs.getString("range_label"),
                        rs.getLong("employee_count")));
    }

    public List<AnalyticsGroupProjection> fetchByCountry(AnalyticsFilter filter) {
        return fetchGroupedBy("country", filter);
    }

    public List<AnalyticsGroupProjection> fetchByDepartment(AnalyticsFilter filter) {
        return fetchGroupedBy("department", filter);
    }

    public List<AnalyticsGroupProjection> fetchByRole(AnalyticsFilter filter) {
        return fetchGroupedBy("job_title", filter);
    }

    private List<AnalyticsGroupProjection> fetchGroupedBy(String groupField, AnalyticsFilter filter) {
        String sql = """
                SELECT
                    e.%s AS group_value,
                    COUNT(*) AS employee_count,
                    COALESCE(SUM(e.current_salary / fx.rate_to_usd), 0)::numeric(19,2) AS total_payroll,
                    COALESCE(AVG(e.current_salary / fx.rate_to_usd), 0)::numeric(19,2) AS average_salary,
                    COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (e.current_salary / fx.rate_to_usd)), 0)::numeric(19,2) AS median_salary
                FROM employee e
                JOIN fx_rate fx ON fx.currency = e.currency
                %s
                GROUP BY e.%s
                ORDER BY total_payroll DESC, e.%s ASC
                """.formatted(groupField, FILTER_CLAUSE, groupField, groupField);

        return jdbcTemplate.query(sql, parameters(filter), (rs, rowNum) -> new AnalyticsGroupProjection(
                rs.getString("group_value"),
                rs.getLong("employee_count"),
                rs.getBigDecimal("total_payroll"),
                rs.getBigDecimal("average_salary"),
                rs.getBigDecimal("median_salary")));
    }

    private MapSqlParameterSource parameters(AnalyticsFilter filter) {
        return new MapSqlParameterSource()
                .addValue("country", filter.country())
                .addValue("department", filter.department())
                .addValue("jobTitle", filter.jobTitle());
    }
}



