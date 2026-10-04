package com.dealstoker.api.web;

import com.dealstoker.api.service.GuideService;
import com.dealstoker.api.web.dto.GuideDtos.GuideDetail;
import com.dealstoker.api.web.dto.GuideDtos.GuideSummary;
import com.dealstoker.api.web.dto.ProductDtos.PageResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/guides")
public class PublicGuideController {

    private final GuideService guideService;

    public PublicGuideController(GuideService guideService) {
        this.guideService = guideService;
    }

    @GetMapping
    public PageResponse<GuideSummary> list(
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return guideService.listPublished(category, page, size);
    }

    @GetMapping("/{slug}")
    public GuideDetail get(@PathVariable String slug) {
        return guideService.getPublishedBySlug(slug);
    }
}
