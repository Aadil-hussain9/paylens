package com.incubyte.paylens.dashboard.web;

import com.incubyte.paylens.dashboard.service.DashboardService;
import com.incubyte.paylens.dashboard.web.dto.DashboardData;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public org.springframework.http.ResponseEntity<?> getDashboardData() {
        try {
            return org.springframework.http.ResponseEntity.ok(dashboardService.getDashboardData());
        } catch (Exception e) {
            java.io.StringWriter sw = new java.io.StringWriter();
            e.printStackTrace(new java.io.PrintWriter(sw));
            return org.springframework.http.ResponseEntity.internalServerError().body(sw.toString());
        }
    }
}
