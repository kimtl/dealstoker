package com.dealstoker.api.web;

import com.dealstoker.api.service.AnalyticsService;
import com.dealstoker.api.web.dto.AnalyticsDtos.PageViewRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PublicAnalyticsController {

    /** Legacy path; blocked by common ad-block lists ("analytics", "pageview"). */
    public static final String LEGACY_PAGEVIEW_PATH = "/api/v1/analytics/pageview";
    /** Neutral path the web beacon uses so privacy lists do not drop first-party views. */
    public static final String PAGEVIEW_PATH = "/api/v1/catalog/views";

    private final AnalyticsService analyticsService;

    public PublicAnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @PostMapping({PAGEVIEW_PATH, LEGACY_PAGEVIEW_PATH})
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
