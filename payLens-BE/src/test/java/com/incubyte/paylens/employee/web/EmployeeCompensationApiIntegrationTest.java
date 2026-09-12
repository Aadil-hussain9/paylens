package com.incubyte.paylens.employee.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
class EmployeeCompensationApiIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @Autowired
    private EmployeeRepository employeeRepository;

    private Employee existingEmployee;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        employeeRepository.deleteAll();
        existingEmployee = employeeRepository.save(new Employee(
                "EMP-77777",
                "Riya",
                "Patel",
                "Software Engineer",
                "Engineering",
                "India",
                EmploymentStatus.ACTIVE,
                new BigDecimal("1200000.00"),
                "INR"
        ));
    }

    @Test
    void shouldUpdateCompensationAndPersistChanges() throws Exception {
        mockMvc.perform(patch("/api/employees/{id}/compensation", existingEmployee.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "newSalary": 2800000,
                                  "currency": "INR",
                                  "reason": "PROMOTION"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(existingEmployee.getId()))
                .andExpect(jsonPath("$.employeeNumber").value("EMP-77777"))
                .andExpect(jsonPath("$.currentSalary").value(2800000.00))
                .andExpect(jsonPath("$.currency").value("INR"));

        Employee saved = employeeRepository.findById(existingEmployee.getId()).orElseThrow();
        assertThat(saved.getCurrentSalary()).isEqualByComparingTo("2800000.00");
        assertThat(saved.getCurrency()).isEqualTo("INR");
    }

    @Test
    void shouldReturnBadRequestForInvalidPayload() throws Exception {
        mockMvc.perform(patch("/api/employees/{id}/compensation", existingEmployee.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "newSalary": 0,
                                  "currency": "INR",
                                  "reason": "PROMOTION"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
    }

    @Test
    void shouldReturnBadRequestForUnsupportedCurrency() throws Exception {
        mockMvc.perform(patch("/api/employees/{id}/compensation", existingEmployee.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "newSalary": 2000000,
                                  "currency": "XYZ",
                                  "reason": "PROMOTION"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
    }

    @Test
    void shouldReturnBadRequestForInvalidReason() throws Exception {
        mockMvc.perform(patch("/api/employees/{id}/compensation", existingEmployee.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "newSalary": 2000000,
                                  "currency": "INR",
                                  "reason": "NOT_A_REASON"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
    }

    @Test
    void shouldReturnNotFoundWhenEmployeeDoesNotExist() throws Exception {
        mockMvc.perform(patch("/api/employees/{id}/compensation", 999999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "newSalary": 2000000,
                                  "currency": "INR",
                                  "reason": "PROMOTION"
                                }
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("EMPLOYEE_NOT_FOUND"));
    }
}


