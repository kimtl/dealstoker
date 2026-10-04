package com.dealstoker.api.web;

import com.dealstoker.api.domain.GuideStatus;
import com.dealstoker.api.service.GuideService;
import com.dealstoker.api.web.dto.GuideDtos.GuideDetail;
import com.dealstoker.api.web.dto.GuideDtos.GuideRequest;
import com.dealstoker.api.web.dto.GuideDtos.GuideSummary;
import com.dealstoker.api.web.dto.ProductDtos.PageResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/guides")
public class AdminGuideController {

    private final GuideService guideService;

    public AdminGuideController(GuideService guideService) {
        this.guideService = guideService;
    }

    @GetMapping
    public PageResponse<GuideSummary> list(
            @RequestParam(required = false) GuideStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return guideService.listAdmin(status, page, size);
    }

    @GetMapping("/{id}")
    public GuideDetail get(@PathVariable Long id) {
        return guideService.getById(id);
    }

    @PostMapping
    public GuideDetail create(@Valid @RequestBody GuideRequest request) {
        return guideService.create(request);
    }

    @PutMapping("/{id}")
    public GuideDetail update(@PathVariable Long id, @Valid @RequestBody GuideRequest request) {
        return guideService.update(id, request);
    }

    @PostMapping("/{id}/publish")
    public GuideDetail publish(@PathVariable Long id) {
        return guideService.setStatus(id, GuideStatus.PUBLISHED);
    }

    @PostMapping("/{id}/unpublish")
    public GuideDetail unpublish(@PathVariable Long id) {
        return guideService.setStatus(id, GuideStatus.DRAFT);
    }

    @DeleteMapping("/{id}")
    public Map<String, Boolean> delete(@PathVariable Long id) {
        guideService.delete(id);
        return Map.of("deleted", true);
    }
}
