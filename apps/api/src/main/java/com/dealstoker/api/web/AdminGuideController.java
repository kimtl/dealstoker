package com.dealstoker.api.web;

import com.dealstoker.api.domain.Category;
import com.dealstoker.api.domain.GuideStatus;
import com.dealstoker.api.service.CategoryService;
import com.dealstoker.api.service.GuideGenerationService;
import com.dealstoker.api.service.GuideService;
import com.dealstoker.api.service.ProductService;
import com.dealstoker.api.util.GuideShortcodes;
import com.dealstoker.api.web.ApiExceptionHandler.NotFoundException;
import com.dealstoker.api.web.dto.GuideDtos.GuideDetail;
import com.dealstoker.api.web.dto.GuideDtos.GuideDraftRequest;
import com.dealstoker.api.web.dto.GuideDtos.GuideDraftResponse;
import com.dealstoker.api.web.dto.GuideDtos.GuideRewriteRequest;
import com.dealstoker.api.web.dto.GuideDtos.GuideRequest;
import com.dealstoker.api.web.dto.GuideDtos.GuideSummary;
import com.dealstoker.api.web.dto.GuideDtos.GuideTranslateRequest;
import com.dealstoker.api.web.dto.GuideDtos.GuideTranslateResponse;
import com.dealstoker.api.web.dto.ProductDtos.ProductDetail;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/guides")
public class AdminGuideController {

    private final GuideService guideService;
    private final GuideGenerationService guideGenerationService;
    private final CategoryService categoryService;
    private final ProductService productService;

    public AdminGuideController(
            GuideService guideService,
            GuideGenerationService guideGenerationService,
            CategoryService categoryService,
            ProductService productService
    ) {
        this.guideService = guideService;
        this.guideGenerationService = guideGenerationService;
        this.categoryService = categoryService;
        this.productService = productService;
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

    /** AI first draft (Markdown with {{product:slug}} shortcodes). Nothing is saved. */
    @PostMapping("/draft")
    public GuideDraftResponse draft(@Valid @RequestBody GuideDraftRequest request) {
        if (!guideGenerationService.isConfigured()) {
            throw new IllegalArgumentException("AI is not configured. Set OPENAI_API_KEY on the API service.");
        }
        Category category = request.categoryId() != null ? categoryService.requireById(request.categoryId()) : null;
        List<ProductDetail> products = new ArrayList<>();
        if (request.productSlugs() != null) {
            for (String slug : request.productSlugs()) {
                if (slug == null || slug.isBlank()) continue;
                try {
                    products.add(productService.getPublishedBySlug(slug.trim()));
                } catch (NotFoundException ex) {
                    throw new IllegalArgumentException("Unknown or unpublished product slug: " + slug.trim());
                }
            }
        }
        GuideGenerationService.Draft draft =
                guideGenerationService.draft(category, request.topic(), products, request.prompt());
        return new GuideDraftResponse(draft.title(), draft.excerpt(), draft.body());
    }

    /**
     * AI rewrite of the current English fields into a fuller, more natural guide. Product data
     * for every embedded shortcode is passed along. Nothing is saved.
     */
    @PostMapping("/rewrite")
    public GuideDraftResponse rewrite(@Valid @RequestBody GuideRewriteRequest request) {
        if (!guideGenerationService.isConfigured()) {
            throw new IllegalArgumentException("AI is not configured. Set OPENAI_API_KEY on the API service.");
        }
        Category category = request.categoryId() != null ? categoryService.requireById(request.categoryId()) : null;
        List<ProductDetail> products = new ArrayList<>();
        for (String slug : GuideShortcodes.productSlugs(request.body())) {
            try {
                products.add(productService.getPublishedBySlug(slug));
            } catch (NotFoundException ex) {
                // Unpublished/removed products are dropped from the rewrite (their cards don't render anyway).
            }
        }
        GuideGenerationService.Draft draft = guideGenerationService.rewrite(
                request.title(), request.excerpt(), request.body(), category, products, request.prompt());
        return new GuideDraftResponse(draft.title(), draft.excerpt(), draft.body());
    }

    /** AI Korean translation of the English fields. Nothing is saved. */
    @PostMapping("/translate")
    public GuideTranslateResponse translate(@Valid @RequestBody GuideTranslateRequest request) {
        GuideGenerationService.Translation translation =
                guideGenerationService.translateToKorean(request.title(), request.excerpt(), request.body());
        return new GuideTranslateResponse(translation.titleKo(), translation.excerptKo(), translation.bodyKo());
    }

    @DeleteMapping("/{id}")
    public Map<String, Boolean> delete(@PathVariable Long id) {
        guideService.delete(id);
        return Map.of("deleted", true);
    }
}
