package com.incubyte.paylens.employee.seed;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.incubyte.paylens.employee.domain.Employee;
import com.incubyte.paylens.employee.domain.EmploymentStatus;
import com.incubyte.paylens.employee.repository.EmployeeRepository;

@Component
@ConditionalOnProperty(prefix = "paylens.employee.seed", name = "enabled", havingValue = "true")
public class EmployeeSeedRunner implements CommandLineRunner {

    private static final long SEED = 42L;
    private static final int EMPLOYEE_COUNT = 10_000;

    private static final SeedCountry[] COUNTRIES = {
            new SeedCountry("India", "INR", 1.0),
            new SeedCountry("United States", "USD", 2.2),
            new SeedCountry("United Kingdom", "GBP", 2.0),
            new SeedCountry("Germany", "EUR", 1.9),
            new SeedCountry("Canada", "CAD", 1.8),
            new SeedCountry("Australia", "AUD", 2.1),
            new SeedCountry("Singapore", "SGD", 2.3),
            new SeedCountry("Japan", "JPY", 250.0)
    };

    private static final String[] DEPARTMENTS = {
            "Engineering",
            "Product",
            "Finance",
            "People",
            "Sales",
            "Operations",
            "Support"
    };

    private static final String[] JOB_TITLES = {
            "Software Engineer",
            "Senior Software Engineer",
            "Staff Engineer",
            "Product Manager",
            "Finance Analyst",
            "HR Specialist",
            "Sales Manager",
            "Operations Lead",
            "Customer Support Specialist"
    };

    private final EmployeeRepository employeeRepository;

    public EmployeeSeedRunner(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (employeeRepository.count() > 0) {
            return;
        }

        Random random = new Random(SEED);
        List<Employee> employees = new ArrayList<>(EMPLOYEE_COUNT);
        for (int index = 1; index <= EMPLOYEE_COUNT; index++) {
            SeedCountry country = COUNTRIES[index % COUNTRIES.length];
            String department = DEPARTMENTS[index % DEPARTMENTS.length];
            String jobTitle = JOB_TITLES[index % JOB_TITLES.length];
            EmploymentStatus status = index % 23 == 0 ? EmploymentStatus.ON_LEAVE : EmploymentStatus.ACTIVE;
            BigDecimal salary = generateSalary(random, country.multiplier(), jobTitle, department);
            employees.add(new Employee(
                    "EMP-%05d".formatted(index),
                    firstName(index),
                    lastName(index),
                    jobTitle,
                    department,
                    country.name(),
                    status,
                    salary,
                    country.currency()
            ));
        }

        employeeRepository.saveAll(employees);
    }

    private BigDecimal generateSalary(Random random, double countryMultiplier, String jobTitle, String department) {
        double base = switch (jobTitle) {
            case "Senior Software Engineer", "Staff Engineer", "Product Manager", "Sales Manager", "Operations Lead" -> 120_000;
            case "Finance Analyst", "HR Specialist", "Customer Support Specialist" -> 75_000;
            default -> 95_000;
        };
        if ("Engineering".equals(department)) {
            base += 10_000;
        } else if ("Finance".equals(department)) {
            base += 6_000;
        }
        double spread = 0.75 + (random.nextDouble() * 0.6);
        double amount = base * countryMultiplier * spread;
        return BigDecimal.valueOf(amount).setScale(2, RoundingMode.HALF_UP);
    }

    private String firstName(int index) {
        return FIRST_NAMES[index % FIRST_NAMES.length];
    }

    private String lastName(int index) {
        return LAST_NAMES[index % LAST_NAMES.length] + "-" + (index / LAST_NAMES.length + 1);
    }

    private record SeedCountry(String name, String currency, double multiplier) {
    }

    private static final String[] FIRST_NAMES = {
            "Ava", "Noah", "Mia", "Liam", "Sofia", "Ethan", "Ivy", "Arjun", "Sara", "Kai"
    };

    private static final String[] LAST_NAMES = {
            "Patel", "Sharma", "Brown", "Johnson", "Smith", "Garcia", "Lee", "Khan", "Wilson", "Nguyen"
    };
}

