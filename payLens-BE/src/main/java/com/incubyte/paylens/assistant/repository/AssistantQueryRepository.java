package com.incubyte.paylens.assistant.repository;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public class AssistantQueryRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public AssistantQueryRepository(NamedParameterJdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final String USD_SALARY = "(e.current_salary / fx.rate_to_usd)";

    private static final String BASE_SQL = """
            FROM employee e
            JOIN fx_rate fx ON fx.currency = e.currency
            WHERE (CAST(:department AS text) IS NULL OR LOWER(e.department) = LOWER(CAST(:department AS text)))
              AND (CAST(:country AS text) IS NULL OR LOWER(e.country) = LOWER(CAST(:country AS text)))
            """;

    public AssistantAggregateResult getAggregates(String department, String country) {
        String sql = """
                SELECT 
                    COUNT(*) as employee_count,
                    COALESCE(SUM(%1$s), 0)::numeric(19,2) as total_payroll,
                    COALESCE(AVG(%1$s), 0)::numeric(19,2) as average_salary,
                    COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY %1$s), 0)::numeric(19,2) as median_salary,
                    COALESCE(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY %1$s), 0)::numeric(19,2) as p75_salary
                """.formatted(USD_SALARY) + BASE_SQL;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("department", department)
                .addValue("country", country);

        return jdbcTemplate.queryForObject(sql, params, (rs, rowNum) -> new AssistantAggregateResult(
                rs.getLong("employee_count"),
                rs.getBigDecimal("total_payroll"),
                rs.getBigDecimal("average_salary"),
                rs.getBigDecimal("median_salary"),
                rs.getBigDecimal("p75_salary")
        ));
    }

    public long getOutliersCount(String department, String country, BigDecimal p75Threshold) {
        String sql = """
                SELECT COUNT(*) as outlier_count
                """ + BASE_SQL + """
                  AND %1$s > :p75Threshold
                """.formatted(USD_SALARY);

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("department", department)
                .addValue("country", country)
                .addValue("p75Threshold", p75Threshold);

        Long count = jdbcTemplate.queryForObject(sql, params, Long.class);
        return count == null ? 0 : count;
    }

    public String getHighestPayrollDepartment() {
        String sql = """
                SELECT e.department
                FROM employee e
                JOIN fx_rate fx ON fx.currency = e.currency
                GROUP BY e.department
                ORDER BY SUM(%1$s) DESC
                LIMIT 1
                """.formatted(USD_SALARY);
        return jdbcTemplate.queryForObject(sql, new MapSqlParameterSource(), String.class);
    }
}
