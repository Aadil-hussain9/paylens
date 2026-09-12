package com.incubyte.paylens.analytics.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import com.incubyte.paylens.employee.domain.Employee;
import com.incubyte.paylens.employee.domain.EmploymentStatus;
import com.incubyte.paylens.employee.repository.EmployeeRepository;

@SpringBootTest
class AnalyticsControllerIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private EmployeeRepository employeeRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        employeeRepository.deleteAll();

        employeeRepository.save(employee("EMP-1", "India", "Engineering", "Senior Software Engineer", "100000.00", "INR"));
        employeeRepository.save(employee("EMP-2", "India", "Engineering", "Senior Software Engineer", "1000.00", "USD"));
        employeeRepository.save(employee("EMP-3", "Canada", "Sales", "Sales Manager", "3000.00", "USD"));
    }

    @Test
    void shouldReturnSummaryWithUsdNormalizedValues() throws Exception {
        mockMvc.perform(get("/api/analytics/summary")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEmployees").value(3))
                .andExpect(jsonPath("$.totalPayroll").value(5204.82))
                .andExpect(jsonPath("$.averageSalary").value(1734.94))
                .andExpect(jsonPath("$.medianSalary").value(1204.82))
                .andExpect(jsonPath("$.reportingCurrency").value("USD"));
    }

    @Test
    void shouldReturnSummaryWithComposableFilters() throws Exception {
        mockMvc.perform(get("/api/analytics/summary")
                        .param("country", "India")
                        .param("department", "Engineering")
                        .param("role", "Senior Software Engineer")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEmployees").value(2))
                .andExpect(jsonPath("$.totalPayroll").value(2204.82))
                .andExpect(jsonPath("$.averageSalary").value(1102.41))
                .andExpect(jsonPath("$.medianSalary").value(1102.41));
    }

    @Test
    void shouldReturnSalaryDistribution() throws Exception {
        mockMvc.perform(get("/api/analytics/salary-distribution")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].range").value("0-50K"))
                .andExpect(jsonPath("$[0].employeeCount").value(3))
                .andExpect(jsonPath("$[4].range").value("200K+"));
    }

    @Test
    void shouldReturnCountryAggregates() throws Exception {
        mockMvc.perform(get("/api/analytics/by-country")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].country").value("Canada"))
                .andExpect(jsonPath("$[0].employeeCount").value(1))
                .andExpect(jsonPath("$[0].reportingCurrency").value("USD"));
    }

    @Test
    void shouldReturnDepartmentAggregates() throws Exception {
        mockMvc.perform(get("/api/analytics/by-department")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].department").value("Sales"));
    }

    @Test
    void shouldReturnRoleAggregates() throws Exception {
        mockMvc.perform(get("/api/analytics/by-role")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].jobTitle").value("Sales Manager"));
    }

    @Test
    void shouldReturnEmptyGroupsAndZeroSummaryForNoMatches() throws Exception {
        mockMvc.perform(get("/api/analytics/summary").param("country", "Germany"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEmployees").value(0))
                .andExpect(jsonPath("$.totalPayroll").value(0.00));

        mockMvc.perform(get("/api/analytics/by-country").param("country", "Germany"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0]").doesNotExist());
    }

    @Test
    void shouldRejectMismatchedRoleAndJobTitle() throws Exception {
        mockMvc.perform(get("/api/analytics/summary")
                        .param("role", "Software Engineer")
                        .param("jobTitle", "Finance Analyst"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
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



