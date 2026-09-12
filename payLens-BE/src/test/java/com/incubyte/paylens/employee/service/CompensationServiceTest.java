package com.incubyte.paylens.employee.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.incubyte.paylens.common.EmployeeNotFoundException;
import com.incubyte.paylens.common.InvalidEmployeeQueryException;
import com.incubyte.paylens.currency.domain.FxRate;
import com.incubyte.paylens.currency.repository.FxRateRepository;
import com.incubyte.paylens.employee.domain.Employee;
import com.incubyte.paylens.employee.domain.EmploymentStatus;
import com.incubyte.paylens.employee.domain.SalaryUpdateReason;
import com.incubyte.paylens.employee.repository.EmployeeRepository;
import com.incubyte.paylens.employee.web.dto.UpdateCompensationRequest;

@ExtendWith(MockitoExtension.class)
class CompensationServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private FxRateRepository fxRateRepository;

    @InjectMocks
    private CompensationService compensationService;

    @Test
    void shouldUpdateCurrentSalarySuccessfully() {
        Employee employee = employee("EMP-00001", "1000.00", "INR");
        UpdateCompensationRequest request = new UpdateCompensationRequest(new BigDecimal("2800000.00"), "INR", SalaryUpdateReason.PROMOTION);

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(fxRateRepository.findByCurrency("INR")).thenReturn(Optional.of(new FxRate("INR", new BigDecimal("83.000000"))));
        when(employeeRepository.save(employee)).thenReturn(employee);

        var response = compensationService.updateCurrentSalary(1L, request);

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.currentSalary()).isEqualByComparingTo("2800000.00");
        assertThat(response.currency()).isEqualTo("INR");
    }

    @Test
    void shouldThrowNotFoundWhenEmployeeDoesNotExist() {
        UpdateCompensationRequest request = new UpdateCompensationRequest(new BigDecimal("2800000.00"), "INR", SalaryUpdateReason.PROMOTION);
        when(employeeRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> compensationService.updateCurrentSalary(99L, request))
                .isInstanceOf(EmployeeNotFoundException.class);

        verify(fxRateRepository, never()).findByCurrency(any());
        verify(employeeRepository, never()).save(any());
    }

    @Test
    void shouldRejectZeroSalary() {
        Employee employee = employee("EMP-00001", "1000.00", "INR");
        UpdateCompensationRequest request = new UpdateCompensationRequest(BigDecimal.ZERO, "INR", SalaryUpdateReason.CORRECTION);
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));

        assertThatThrownBy(() -> compensationService.updateCurrentSalary(1L, request))
                .isInstanceOf(InvalidEmployeeQueryException.class)
                .hasMessageContaining("newSalary");
    }

    @Test
    void shouldRejectNegativeSalary() {
        Employee employee = employee("EMP-00001", "1000.00", "INR");
        UpdateCompensationRequest request = new UpdateCompensationRequest(new BigDecimal("-1.00"), "INR", SalaryUpdateReason.CORRECTION);
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));

        assertThatThrownBy(() -> compensationService.updateCurrentSalary(1L, request))
                .isInstanceOf(InvalidEmployeeQueryException.class)
                .hasMessageContaining("newSalary");
    }

    @Test
    void shouldRejectMissingCurrency() {
        Employee employee = employee("EMP-00001", "1000.00", "INR");
        UpdateCompensationRequest request = new UpdateCompensationRequest(new BigDecimal("10.00"), " ", SalaryUpdateReason.CORRECTION);
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));

        assertThatThrownBy(() -> compensationService.updateCurrentSalary(1L, request))
                .isInstanceOf(InvalidEmployeeQueryException.class)
                .hasMessageContaining("currency");
    }

    @Test
    void shouldRejectInvalidCurrency() {
        Employee employee = employee("EMP-00001", "1000.00", "INR");
        UpdateCompensationRequest request = new UpdateCompensationRequest(new BigDecimal("10.00"), "XYZ", SalaryUpdateReason.CORRECTION);
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(fxRateRepository.findByCurrency("XYZ")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> compensationService.updateCurrentSalary(1L, request))
                .isInstanceOf(InvalidEmployeeQueryException.class)
                .hasMessageContaining("Unsupported currency");
    }

    @Test
    void shouldRejectMissingReason() {
        Employee employee = employee("EMP-00001", "1000.00", "INR");
        UpdateCompensationRequest request = new UpdateCompensationRequest(new BigDecimal("10.00"), "INR", null);
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));

        assertThatThrownBy(() -> compensationService.updateCurrentSalary(1L, request))
                .isInstanceOf(InvalidEmployeeQueryException.class)
                .hasMessageContaining("reason");
    }

    @Test
    void shouldReplaceExistingEmployeeSalary() {
        Employee employee = employee("EMP-00001", "1000.00", "INR");
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(fxRateRepository.findByCurrency("INR")).thenReturn(Optional.of(new FxRate("INR", new BigDecimal("83.000000"))));
        when(employeeRepository.save(employee)).thenReturn(employee);

        compensationService.updateCurrentSalary(1L, new UpdateCompensationRequest(new BigDecimal("4500.50"), "INR", SalaryUpdateReason.ANNUAL_REVIEW));

        assertThat(employee.getCurrentSalary()).isEqualByComparingTo("4500.50");
    }

    @Test
    void shouldReplaceExistingEmployeeCurrency() {
        Employee employee = employee("EMP-00001", "1000.00", "INR");
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(fxRateRepository.findByCurrency("USD")).thenReturn(Optional.of(new FxRate("USD", new BigDecimal("1.000000"))));
        when(employeeRepository.save(employee)).thenReturn(employee);

        compensationService.updateCurrentSalary(1L, new UpdateCompensationRequest(new BigDecimal("1000.00"), "usd", SalaryUpdateReason.ROLE_CHANGE));

        assertThat(employee.getCurrency()).isEqualTo("USD");
    }

    @Test
    void shouldInvokeRepositoryPersistenceWithUpdatedState() {
        Employee employee = employee("EMP-00001", "1000.00", "INR");
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(fxRateRepository.findByCurrency("INR")).thenReturn(Optional.of(new FxRate("INR", new BigDecimal("83.000000"))));
        when(employeeRepository.save(employee)).thenReturn(employee);

        compensationService.updateCurrentSalary(1L, new UpdateCompensationRequest(new BigDecimal("2000.00"), "INR", SalaryUpdateReason.MARKET_ADJUSTMENT));

        ArgumentCaptor<Employee> employeeCaptor = ArgumentCaptor.forClass(Employee.class);
        verify(employeeRepository).save(employeeCaptor.capture());
        assertThat(employeeCaptor.getValue().getCurrentSalary()).isEqualByComparingTo("2000.00");
        assertThat(employeeCaptor.getValue().getCurrency()).isEqualTo("INR");
    }

    @Test
    void shouldPropagateBusinessExceptionForInvalidEmployeeId() {
        UpdateCompensationRequest request = new UpdateCompensationRequest(new BigDecimal("1000.00"), "INR", SalaryUpdateReason.OTHER);

        assertThatThrownBy(() -> compensationService.updateCurrentSalary(0L, request))
                .isInstanceOf(InvalidEmployeeQueryException.class)
                .hasMessageContaining("id");
    }

    @Test
    void shouldNotPersistWhenCurrencyIsInvalid() {
        Employee employee = employee("EMP-00001", "1000.00", "INR");
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(fxRateRepository.findByCurrency("BAD")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> compensationService.updateCurrentSalary(1L,
                new UpdateCompensationRequest(new BigDecimal("1000.00"), "BAD", SalaryUpdateReason.CORRECTION)))
                .isInstanceOf(InvalidEmployeeQueryException.class);

        verify(employeeRepository, never()).save(any());
    }

    private Employee employee(String employeeNumber, String salary, String currency) {
        Employee employee = new Employee(employeeNumber, "John", "Smith", "Engineer", "Engineering", "India",
                EmploymentStatus.ACTIVE, new BigDecimal(salary), currency);
        employee.setId(1L);
        return employee;
    }
}

