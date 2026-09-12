package com.incubyte.paylens.employee.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.incubyte.paylens.common.EmployeeNotFoundException;
import com.incubyte.paylens.common.GlobalExceptionHandler;
import com.incubyte.paylens.common.PageResponse;
import com.incubyte.paylens.employee.domain.EmploymentStatus;
import com.incubyte.paylens.employee.service.CompensationService;
import com.incubyte.paylens.employee.service.EmployeeService;
import com.incubyte.paylens.employee.web.dto.EmployeeDetailsResponse;
import com.incubyte.paylens.employee.web.dto.EmployeeSearchCriteria;
import com.incubyte.paylens.employee.web.dto.EmployeeSummaryResponse;
import com.incubyte.paylens.employee.web.dto.UpdateCompensationRequest;

@ExtendWith(MockitoExtension.class)
class EmployeeControllerTest {

    @Mock
    private EmployeeService employeeService;

    @Mock
    private CompensationService compensationService;

    @InjectMocks
    private EmployeeController controller;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void shouldReturnPagedEmployees() throws Exception {
        EmployeeSummaryResponse summary = new EmployeeSummaryResponse(1L, "EMP-00001", "John", "Smith", "Engineer", "Engineering", "India", EmploymentStatus.ACTIVE);
        when(employeeService.listEmployees(any())).thenReturn(new PageResponse<>(java.util.List.of(summary), 0, 25, 1, 1));

        mockMvc.perform(get("/api/employees")
                        .param("page", "0")
                        .param("pageSize", "25")
                        .param("search", "john")
                        .param("country", "India")
                        .param("department", "Engineering")
                        .param("sortBy", "lastName")
                        .param("sortDirection", "DESC")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].employeeNumber").value("EMP-00001"))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.pageSize").value(25))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.totalPages").value(1));

        ArgumentCaptor<EmployeeSearchCriteria> criteriaCaptor = ArgumentCaptor.forClass(EmployeeSearchCriteria.class);
        verify(employeeService).listEmployees(criteriaCaptor.capture());
        EmployeeSearchCriteria criteria = criteriaCaptor.getValue();
        assertThat(criteria.page()).isEqualTo(0);
        assertThat(criteria.pageSize()).isEqualTo(25);
        assertThat(criteria.search()).isEqualTo("john");
        assertThat(criteria.country()).isEqualTo("India");
        assertThat(criteria.department()).isEqualTo("Engineering");
        assertThat(criteria.sortBy()).isEqualTo("lastName");
        assertThat(criteria.sortDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    void shouldReturnEmployeeDetails() throws Exception {
        EmployeeDetailsResponse details = new EmployeeDetailsResponse(1L, "EMP-00001", "John", "Smith", "Engineer", "Engineering", "India", EmploymentStatus.ACTIVE, new BigDecimal("1000.00"), "INR");
        when(employeeService.getEmployeeById(1L)).thenReturn(details);

        mockMvc.perform(get("/api/employees/1").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.employeeNumber").value("EMP-00001"))
                .andExpect(jsonPath("$.currentSalary").value(1000.00))
                .andExpect(jsonPath("$.currency").value("INR"));
    }

    @Test
    void shouldRejectUnsupportedPageSize() throws Exception {
        mockMvc.perform(get("/api/employees").param("pageSize", "1000").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));

        verify(employeeService, never()).listEmployees(any());
    }

    @Test
    void shouldRejectUnsupportedSortField() throws Exception {
        mockMvc.perform(get("/api/employees").param("sortBy", "salaryHistory").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));

        verify(employeeService, never()).listEmployees(any());
    }

    @Test
    void shouldReturn404WhenEmployeeIsMissing() throws Exception {
        when(employeeService.getEmployeeById(99L)).thenThrow(new EmployeeNotFoundException(99L));

        mockMvc.perform(get("/api/employees/99").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("EMPLOYEE_NOT_FOUND"))
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void shouldPatchEmployeeCompensation() throws Exception {
        EmployeeDetailsResponse details = new EmployeeDetailsResponse(1L, "EMP-00001", "John", "Smith", "Engineer", "Engineering", "India", EmploymentStatus.ACTIVE, new BigDecimal("2800000.00"), "INR");
        when(compensationService.updateCurrentSalary(eq(1L), any(UpdateCompensationRequest.class))).thenReturn(details);

        mockMvc.perform(patch("/api/employees/1/compensation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "newSalary": 2800000,
                                  "currency": "INR",
                                  "reason": "PROMOTION"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.currentSalary").value(2800000.00))
                .andExpect(jsonPath("$.currency").value("INR"));
    }

    @Test
    void shouldReturnBadRequestWhenCompensationPayloadIsInvalid() throws Exception {
        mockMvc.perform(patch("/api/employees/1/compensation")
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

        verify(compensationService, never()).updateCurrentSalary(eq(1L), any(UpdateCompensationRequest.class));
    }

    @Test
    void shouldReturnNotFoundWhenCompensationUpdateEmployeeIsMissing() throws Exception {
        when(compensationService.updateCurrentSalary(eq(99L), any(UpdateCompensationRequest.class)))
                .thenThrow(new EmployeeNotFoundException(99L));

        mockMvc.perform(patch("/api/employees/99/compensation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "newSalary": 2800000,
                                  "currency": "INR",
                                  "reason": "PROMOTION"
                                }
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("EMPLOYEE_NOT_FOUND"));
    }

    @Test
    void shouldReturnBadRequestWhenReasonValueIsInvalid() throws Exception {
        mockMvc.perform(patch("/api/employees/1/compensation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "newSalary": 2800000,
                                  "currency": "INR",
                                  "reason": "UNSUPPORTED_REASON"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
    }

    @Test
    void shouldReturnConflictWhenCompensationUpdateHasConcurrentModification() throws Exception {
        when(compensationService.updateCurrentSalary(eq(1L), any(UpdateCompensationRequest.class)))
                .thenThrow(new ObjectOptimisticLockingFailureException("employee", 1L));

        mockMvc.perform(patch("/api/employees/1/compensation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "newSalary": 3000000,
                                  "currency": "INR",
                                  "reason": "CORRECTION"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONCURRENT_MODIFICATION"));
    }
}


