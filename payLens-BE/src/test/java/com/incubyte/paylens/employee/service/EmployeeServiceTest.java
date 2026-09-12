package com.incubyte.paylens.employee.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import com.incubyte.paylens.common.EmployeeNotFoundException;
import com.incubyte.paylens.employee.domain.Employee;
import com.incubyte.paylens.employee.domain.EmploymentStatus;
import com.incubyte.paylens.employee.repository.EmployeeRepository;
import com.incubyte.paylens.employee.web.dto.EmployeeSearchCriteria;
import com.incubyte.paylens.employee.web.dto.EmployeeSummaryResponse;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private EmployeeService employeeService;

    @Test
    void shouldReturnPagedAndSortedSummaries() {
        Employee employee = employee("EMP-00001", "John", "Smith", "Engineer", "Engineering", "India", EmploymentStatus.ACTIVE, "1000.00", "INR");
        Page<Employee> repositoryPage = new PageImpl<>(List.of(employee), PageRequest.of(0, 25, Sort.by(Sort.Direction.DESC, "lastName")), 1);
        when(employeeRepository.findAll((Specification<Employee>) any(Specification.class), any(Pageable.class))).thenReturn(repositoryPage);

        EmployeeSearchCriteria criteria = new EmployeeSearchCriteria(0, 25, "john", "India", "Engineering", null, EmploymentStatus.ACTIVE, "lastName", Sort.Direction.DESC);
        var response = employeeService.listEmployees(criteria);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(employeeRepository).findAll((Specification<Employee>) any(Specification.class), pageableCaptor.capture());
        Pageable pageable = pageableCaptor.getValue();

        assertThat(pageable.getPageNumber()).isEqualTo(0);
        assertThat(pageable.getPageSize()).isEqualTo(25);
        assertThat(pageable.getSort()).containsExactly(Sort.Order.desc("lastName"));
        assertThat(response.content()).hasSize(1);
        assertThat(response.content()).extracting(EmployeeSummaryResponse::employeeNumber).containsExactly("EMP-00001");
        assertThat(response.totalElements()).isEqualTo(1);
        assertThat(response.totalPages()).isEqualTo(1);
    }

    @Test
    void shouldReturnEmployeeDetailsWhenFound() {
        Employee employee = employee("EMP-00002", "Jane", "Doe", "Analyst", "Finance", "United States", EmploymentStatus.ON_LEAVE, "2000.00", "USD");
        when(employeeRepository.findById(2L)).thenReturn(Optional.of(employee));

        var response = employeeService.getEmployeeById(2L);

        assertThat(response.employeeNumber()).isEqualTo("EMP-00002");
        assertThat(response.currentSalary()).isEqualByComparingTo("2000.00");
        assertThat(response.currency()).isEqualTo("USD");
    }

    @Test
    void shouldThrowNotFoundWhenEmployeeDoesNotExist() {
        when(employeeRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> employeeService.getEmployeeById(99L))
                .isInstanceOf(EmployeeNotFoundException.class)
                .hasMessageContaining("99");
    }

    private Employee employee(String employeeNumber, String firstName, String lastName, String jobTitle,
            String department, String country, EmploymentStatus employmentStatus, String salary, String currency) {
        return new Employee(employeeNumber, firstName, lastName, jobTitle, department, country, employmentStatus, new BigDecimal(salary), currency);
    }
}


