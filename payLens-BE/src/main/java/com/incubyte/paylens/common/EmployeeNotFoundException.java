package com.incubyte.paylens.common;

public class EmployeeNotFoundException extends RuntimeException {

    public EmployeeNotFoundException(Long employeeId) {
        super("Employee with id %d was not found".formatted(employeeId));
    }
}

