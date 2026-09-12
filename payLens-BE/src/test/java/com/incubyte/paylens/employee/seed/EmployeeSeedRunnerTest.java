package com.incubyte.paylens.employee.seed;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import com.incubyte.paylens.employee.repository.EmployeeRepository;

@SpringBootTest(properties = "paylens.employee.seed.enabled=true")
class EmployeeSeedRunnerTest {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Test
    void shouldSeedExactlyTenThousandEmployeesDeterministically() {
        assertThat(employeeRepository.count()).isEqualTo(10_000);
        assertThat(employeeRepository.findAll(PageRequest.of(0, 1, Sort.by("employeeNumber")))
                .getContent()
                .get(0)
                .getEmployeeNumber()).isEqualTo("EMP-00001");
    }
}

