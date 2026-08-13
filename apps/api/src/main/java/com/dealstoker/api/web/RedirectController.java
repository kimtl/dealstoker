package com.dealstoker.api.web;

import com.dealstoker.api.service.ClickTrackingService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
public class RedirectController {

    private final ClickTrackingService clickTrackingService;

    public RedirectController(ClickTrackingService clickTrackingService) {
        this.clickTrackingService = clickTrackingService;
    }

    @GetMapping({"/go/{slug}", "/api/v1/go/{slug}"})
    public ResponseEntity<Void> go(@PathVariable String slug, HttpServletRequest request) {
        String target = clickTrackingService.trackAndBuildRedirect(slug, request);
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, target)
                .build();
    }
}
