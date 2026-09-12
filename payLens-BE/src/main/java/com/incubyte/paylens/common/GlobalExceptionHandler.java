package com.incubyte.paylens.common;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.core.convert.ConversionFailedException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EmployeeNotFoundException.class)
    ResponseEntity<ApiError> handleNotFound(EmployeeNotFoundException exception) {
        return build(HttpStatus.NOT_FOUND, "EMPLOYEE_NOT_FOUND", exception.getMessage(), List.of(exception.getMessage()));
    }

    @ExceptionHandler(InvalidEmployeeQueryException.class)
    ResponseEntity<ApiError> handleBadRequest(InvalidEmployeeQueryException exception) {
        return build(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", exception.getMessage(), List.of(exception.getMessage()));
    }

    @ExceptionHandler({MethodArgumentTypeMismatchException.class, MissingServletRequestParameterException.class,
            MethodArgumentNotValidException.class, ConversionFailedException.class, HttpMessageNotReadableException.class})
    ResponseEntity<ApiError> handleRequestBinding(Exception exception) {
        return build(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", "The request parameters are invalid", List.of(exception.getMessage()));
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    ResponseEntity<ApiError> handleOptimisticLocking(ObjectOptimisticLockingFailureException exception) {
        return build(HttpStatus.CONFLICT, "CONCURRENT_MODIFICATION",
                "The employee was updated by another request. Please retry with the latest data.",
                List.of("Concurrent update detected"));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> handleUnexpected(Exception exception) {
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", "An unexpected error occurred", List.of("Please contact support if the problem persists."));
    }

    private ResponseEntity<ApiError> build(HttpStatus status, String code, String message, List<String> details) {
        ApiError body = new ApiError(OffsetDateTime.now(), status.value(), status.getReasonPhrase(), code, message, details);
        return ResponseEntity.status(status).body(body);
    }
}

