package com.incubyte.paylens.employee.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import com.incubyte.paylens.employee.domain.Employee;
import com.incubyte.paylens.employee.domain.EmploymentStatus;
import com.incubyte.paylens.employee.repository.EmployeeRepository;

@SpringBootTest
class EmployeeApiIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private EmployeeRepository employeeRepository;

    private MockMvc mockMvc;
    private Employee usdEmployee;
    private Employee inrEmployee;
    private Employee financeEmployee;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        employeeRepository.deleteAll();

        usdEmployee = employeeRepository.save(new Employee(
                "EMP-00001",
                "Ava",
                "Patel",
                "Software Engineer",
                "Engineering",
                "United States",
                EmploymentStatus.ACTIVE,
                new BigDecimal("1000.00"),
                "USD"
        ));

        inrEmployee = employeeRepository.save(new Employee(
                "EMP-00002",
                "Riya",
                "Sharma",
                "Software Engineer",
                "Engineering",
                "India",
                EmploymentStatus.ACTIVE,
                new BigDecimal("1200000.00"),
                "INR"
        ));

        financeEmployee = employeeRepository.save(new Employee(
                "EMP-00003",
                "John",
                "Doe",
                "Finance Analyst",
                "Finance",
                "Canada",
                EmploymentStatus.ON_LEAVE,
                new BigDecimal("90000.00"),
                "CAD"
        ));
    }

    @Test
    void shouldReturnEmployeeListContractForAngularTable() throws Exception {
        mockMvc.perform(get("/api/employees")
                        .param("page", "0")
                        .param("pageSize", "10")
                        .param("search", "riya")
                        .param("country", "India")
                        .param("department", "Engineering")
                        .param("role", "Software Engineer")
                        .param("employmentStatus", "ACTIVE")
                        .param("sortBy", "employeeNumber")
                        .param("sortDirection", "ASC")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.pageSize").value(10))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.totalPages").value(1))
                .andExpect(jsonPath("$.content[0].id").value(inrEmployee.getId()))
                .andExpect(jsonPath("$.content[0].employeeNumber").value("EMP-00002"))
                .andExpect(jsonPath("$.content[0].firstName").value("Riya"))
                .andExpect(jsonPath("$.content[0].lastName").value("Sharma"))
                .andExpect(jsonPath("$.content[0].jobTitle").value("Software Engineer"))
                .andExpect(jsonPath("$.content[0].department").value("Engineering"))
                .andExpect(jsonPath("$.content[0].country").value("India"))
                .andExpect(jsonPath("$.content[0].employmentStatus").value("ACTIVE"));
    }

    @Test
    void shouldReturnEmployeeDetailsContract() throws Exception {
        mockMvc.perform(get("/api/employees/{id}", financeEmployee.getId())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(financeEmployee.getId()))
                .andExpect(jsonPath("$.employeeNumber").value("EMP-00003"))
                .andExpect(jsonPath("$.firstName").value("John"))
                .andExpect(jsonPath("$.lastName").value("Doe"))
                .andExpect(jsonPath("$.jobTitle").value("Finance Analyst"))
                .andExpect(jsonPath("$.department").value("Finance"))
                .andExpect(jsonPath("$.country").value("Canada"))
                .andExpect(jsonPath("$.employmentStatus").value("ON_LEAVE"))
                .andExpect(jsonPath("$.currentSalary").value(90000.00))
                .andExpect(jsonPath("$.currency").value("CAD"));
    }

    @Test
    void shouldReturnPredictableValidationErrorsForCompensationPayload() throws Exception {
        mockMvc.perform(patch("/api/employees/{id}/compensation", usdEmployee.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "newSalary": 0,
                                  "currency": "   "
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details[0]").value("currency: currency is required"))
                .andExpect(jsonPath("$.details[1]").value("newSalary: newSalary must be greater than zero"))
                .andExpect(jsonPath("$.details[2]").value("reason: reason is required"));
    }

    @Test
    void shouldAllowConfiguredAngularDevOriginForApiPreflight() throws Exception {
        mockMvc.perform(options("/api/employees")
                        .header(HttpHeaders.ORIGIN, "http://localhost:4200")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:4200"));
    }

    @Test
    void shouldReflectSalaryUpdateInEmployeeDetailsAndAnalyticsSummary() throws Exception {
        mockMvc.perform(get("/api/employees/{id}", usdEmployee.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentSalary").value(1000.00))
                .andExpect(jsonPath("$.currency").value("USD"));

        mockMvc.perform(get("/api/analytics/summary")
                        .param("country", "United States")
                        .param("department", "Engineering")
                        .param("jobTitle", "Software Engineer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEmployees").value(1))
                .andExpect(jsonPath("$.totalPayroll").value(1000.00))
                .andExpect(jsonPath("$.averageSalary").value(1000.00))
                .andExpect(jsonPath("$.medianSalary").value(1000.00));

        mockMvc.perform(patch("/api/employees/{id}/compensation", usdEmployee.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "newSalary": 2000.00,
                                  "currency": "USD",
                                  "reason": "CORRECTION"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentSalary").value(2000.00))
                .andExpect(jsonPath("$.currency").value("USD"));

        mockMvc.perform(get("/api/employees/{id}", usdEmployee.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentSalary").value(2000.00))
                .andExpect(jsonPath("$.currency").value("USD"));

        mockMvc.perform(get("/api/analytics/summary")
                        .param("country", "United States")
                        .param("department", "Engineering")
                        .param("jobTitle", "Software Engineer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEmployees").value(1))
                .andExpect(jsonPath("$.totalPayroll").value(2000.00))
                .andExpect(jsonPath("$.averageSalary").value(2000.00))
                .andExpect(jsonPath("$.medianSalary").value(2000.00))
                .andExpect(jsonPath("$.reportingCurrency").value("USD"));
    }
}

