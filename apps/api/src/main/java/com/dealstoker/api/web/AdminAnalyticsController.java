package com.dealstoker.api.web;

import com.dealstoker.api.service.AnalyticsService;
import com.dealstoker.api.web.dto.AnalyticsDtos.AnalyticsSummary;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/analytics")
public class AdminAnalyticsController {

    private final AnalyticsService analyticsService;

    public AdminAnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/summary")
    public AnalyticsSummary summary(@RequestParam(defaultValue = "7") int days) {
        return analyticsService.summary(days);
    }
}
