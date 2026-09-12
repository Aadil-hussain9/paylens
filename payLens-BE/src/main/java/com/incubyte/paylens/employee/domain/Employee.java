package com.incubyte.paylens.employee.domain;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "employee", indexes = {
        @Index(name = "idx_employee_employee_number", columnList = "employee_number", unique = true),
        @Index(name = "idx_employee_country", columnList = "country"),
        @Index(name = "idx_employee_department", columnList = "department"),
        @Index(name = "idx_employee_job_title", columnList = "job_title"),
        @Index(name = "idx_employee_employment_status", columnList = "employment_status"),
        @Index(name = "idx_employee_last_name_first_name", columnList = "last_name, first_name")
})
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_number", nullable = false, unique = true, length = 50)
    private String employeeNumber;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "job_title", nullable = false, length = 100)
    private String jobTitle;

    @Column(name = "department", nullable = false, length = 100)
    private String department;

    @Column(name = "country", nullable = false, length = 100)
    private String country;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_status", nullable = false, length = 30)
    private EmploymentStatus employmentStatus;

    @Column(name = "current_salary", nullable = false, precision = 19, scale = 2)
    private BigDecimal currentSalary;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    public Employee(String employeeNumber, String firstName, String lastName, String jobTitle,
            String department, String country, EmploymentStatus employmentStatus,
            BigDecimal currentSalary, String currency) {
        this.employeeNumber = employeeNumber;
        this.firstName = firstName;
        this.lastName = lastName;
        this.jobTitle = jobTitle;
        this.department = department;
        this.country = country;
        this.employmentStatus = employmentStatus;
        this.currentSalary = currentSalary;
        this.currency = currency;
    }
}

