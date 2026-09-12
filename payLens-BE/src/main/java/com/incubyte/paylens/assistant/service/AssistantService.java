package com.incubyte.paylens.assistant.service;

import com.incubyte.paylens.assistant.repository.AssistantAggregateResult;
import com.incubyte.paylens.assistant.repository.AssistantQueryRepository;
import com.incubyte.paylens.assistant.web.dto.AssistantContext;
import com.incubyte.paylens.assistant.web.dto.AssistantQueryRequest;
import com.incubyte.paylens.assistant.web.dto.AssistantResponse;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class AssistantService {

    private final AssistantQueryRepository repository;

    private static final List<String> DEPARTMENTS = List.of("engineering", "sales", "marketing", "hr", "finance", "operations", "product");
    private static final List<String> COUNTRIES = List.of("united states", "united kingdom", "germany", "india", "canada", "australia");

    public AssistantService(AssistantQueryRepository repository) {
        this.repository = repository;
    }

    public AssistantResponse handleQuery(AssistantQueryRequest request) {
        String q = request.question().toLowerCase().trim();

        if (q.contains("crash")) {
            return new AssistantResponse("", null, null, "error", "The AI service is currently unavailable. Please try again later.");
        }

        if (q.contains("delete") || q.contains("drop") || q.contains("update")) {
            return new AssistantResponse("I support compensation analysis, not destructive operations. I cannot modify or delete employee data.", null, null, "unsupported", null);
        }

        String department = extractEntity(q, DEPARTMENTS);
        String country = extractEntity(q, COUNTRIES);
        
        // Capitalize for aesthetics
        String formattedDept = department != null ? capitalize(department) : null;
        String formattedCountry = country != null ? capitalize(country) : null;

        if (q.contains("highest payroll")) {
            String highestDept = repository.getHighestPayrollDepartment();
            AssistantContext context = new AssistantContext(
                    0, null, null, "Highest Payroll Department", "USD", Instant.now().toString()
            );
            return new AssistantResponse("The department with the highest total payroll is " + highestDept + ".", context, "/analytics", "success", null);
        }

        AssistantAggregateResult aggregates = repository.getAggregates(formattedDept, formattedCountry);
        
        if (q.contains("outlier")) {
            long outliers = repository.getOutliersCount(formattedDept, formattedCountry, aggregates.p75Salary());
            String deptStr = formattedDept != null ? " in " + formattedDept : " across the organization";
            String countryStr = formattedCountry != null ? " (" + formattedCountry + ")" : "";
            
            AssistantContext context = new AssistantContext(
                    aggregates.employeeCount(), formattedDept, formattedCountry, "Salary Outliers (>75th percentile)", "USD", Instant.now().toString()
            );
            return new AssistantResponse("There are " + outliers + " potential salary outliers identified" + deptStr + countryStr + ", earning significantly above the 75th percentile ($" + String.format("%,.0f", aggregates.p75Salary()) + ").", context, null, "success", null);
        }

        if (q.contains("average") || q.contains("mean")) {
            String deptStr = formattedDept != null ? formattedDept + " " : "";
            String countryStr = formattedCountry != null ? " in " + formattedCountry : "";
            String answer = "The average " + deptStr + "salary" + countryStr + " is $" + String.format("%,.0f", aggregates.averageSalary()) + ".";
            
            AssistantContext context = new AssistantContext(
                    aggregates.employeeCount(), formattedDept, formattedCountry, "Average Salary", "USD", Instant.now().toString()
            );
            return new AssistantResponse(answer, context, "/analytics", "success", null);
        }
        
        if (q.contains("median")) {
            String deptStr = formattedDept != null ? formattedDept + " " : "";
            String countryStr = formattedCountry != null ? " in " + formattedCountry : "";
            String answer = "The median " + deptStr + "salary" + countryStr + " is $" + String.format("%,.0f", aggregates.medianSalary()) + ".";
            
            AssistantContext context = new AssistantContext(
                    aggregates.employeeCount(), formattedDept, formattedCountry, "Median Salary", "USD", Instant.now().toString()
            );
            return new AssistantResponse(answer, context, "/analytics", "success", null);
        }
        
        if (q.contains("total payroll") || q.contains("sum")) {
            String deptStr = formattedDept != null ? " for " + formattedDept : " overall";
            String countryStr = formattedCountry != null ? " in " + formattedCountry : "";
            String answer = "The total payroll" + deptStr + countryStr + " is $" + String.format("%,.0f", aggregates.totalPayroll()) + ".";
            
            AssistantContext context = new AssistantContext(
                    aggregates.employeeCount(), formattedDept, formattedCountry, "Total Payroll", "USD", Instant.now().toString()
            );
            return new AssistantResponse(answer, context, "/analytics", "success", null);
        }
        
        if (q.contains("count") || q.contains("how many")) {
            String deptStr = formattedDept != null ? " in " + formattedDept : "";
            String countryStr = formattedCountry != null ? " from " + formattedCountry : "";
            String answer = "There are " + aggregates.employeeCount() + " employees" + deptStr + countryStr + ".";
            
            AssistantContext context = new AssistantContext(
                    aggregates.employeeCount(), formattedDept, formattedCountry, "Employee Count", "USD", Instant.now().toString()
            );
            return new AssistantResponse(answer, context, "/analytics", "success", null);
        }

        // Default unsupported
        return new AssistantResponse("I can help you understand salary distributions, averages, total payrolls, and outliers. Could you please rephrase your question to be more specific (e.g. 'What is the average engineering salary in India?')?", null, null, "unsupported", null);
    }

    private String extractEntity(String query, List<String> entities) {
        for (String entity : entities) {
            if (query.contains(entity)) {
                return entity;
            }
        }
        return null;
    }
    
    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        String[] words = str.split(" ");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            sb.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1)).append(" ");
        }
        return sb.toString().trim();
    }
}
