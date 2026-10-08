package com.dealstoker.api.web;

import com.dealstoker.api.service.PriceRefreshService;
import com.dealstoker.api.service.PriceRefreshService.Status;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Status and manual trigger for the daily Amazon price refresh. */
@RestController
@RequestMapping("/api/v1/admin/prices")
public class AdminPriceController {

    private final PriceRefreshService priceRefreshService;

    public AdminPriceController(PriceRefreshService priceRefreshService) {
        this.priceRefreshService = priceRefreshService;
    }

    @GetMapping("/status")
    public Status status() {
        return priceRefreshService.status();
    }

    /** 202 when a run was started, 409 when one is already running. */
    @PostMapping("/refresh")
    public ResponseEntity<Status> refresh() {
        boolean started = priceRefreshService.startManualRefresh();
        return ResponseEntity.status(started ? HttpStatus.ACCEPTED : HttpStatus.CONFLICT)
                .body(priceRefreshService.status());
    }
}
