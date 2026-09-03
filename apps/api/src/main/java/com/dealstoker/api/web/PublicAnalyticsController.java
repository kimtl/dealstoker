package com.dealstoker.api.web;

import com.dealstoker.api.service.AnalyticsService;
import com.dealstoker.api.web.dto.AnalyticsDtos.PageViewRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
public class PublicAnalyticsController {

    private final AnalyticsService analyticsService;

    public PublicAnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @PostMapping("/pageview")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void pageView(
            @Valid @RequestBody(required = false) PageViewRequest request,
            HttpServletRequest httpRequest
    ) {
        analyticsService.recordPageView(
                request != null ? request : new PageViewRequest(null, null, null, null, null),
                httpRequest
        );
    }
}
