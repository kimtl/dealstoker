package com.dealstoker.api.service;

import com.dealstoker.api.domain.Guide;
import com.dealstoker.api.domain.GuideStatus;
import com.dealstoker.api.repository.GuideRepository;
import com.dealstoker.api.util.Slugify;
import com.dealstoker.api.web.ApiExceptionHandler.NotFoundException;
import com.dealstoker.api.web.dto.GuideDtos.GuideDetail;
import com.dealstoker.api.web.dto.GuideDtos.GuideRequest;
import com.dealstoker.api.web.dto.GuideDtos.GuideSummary;
import com.dealstoker.api.web.dto.ProductDtos.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class GuideService {

    private static final int MAX_PAGE_SIZE = 50;

    private final GuideRepository guideRepository;
    private final CategoryService categoryService;

    public GuideService(GuideRepository guideRepository, CategoryService categoryService) {
        this.guideRepository = guideRepository;
        this.categoryService = categoryService;
    }

    // ---------- public ----------

    @Transactional(readOnly = true)
    public PageResponse<GuideSummary> listPublished(String categorySlug, int page, int size) {
        PageRequest pageable = PageRequest.of(Math.max(0, page), clampSize(size));
        Page<Guide> result = categorySlug == null || categorySlug.isBlank()
                ? guideRepository.findByStatusOrderByPublishedAtDescUpdatedAtDesc(GuideStatus.PUBLISHED, pageable)
                : guideRepository.findByStatusAndCategorySlugOrderByPublishedAtDescUpdatedAtDesc(
                        GuideStatus.PUBLISHED, categorySlug.trim(), pageable);
        return toPage(result);
    }

    @Transactional(readOnly = true)
    public GuideDetail getPublishedBySlug(String slug) {
        return guideRepository.findBySlugAndStatus(slug, GuideStatus.PUBLISHED)
                .map(GuideDetail::from)
                .orElseThrow(() -> new NotFoundException("Guide not found: " + slug));
    }

    /** For the sitemap. */
    @Transactional(readOnly = true)
    public List<Guide> publishedForSitemap(int limit) {
        return guideRepository.findByStatusOrderByPublishedAtDesc(
                GuideStatus.PUBLISHED, PageRequest.of(0, Math.max(1, limit)));
    }

    // ---------- admin ----------

    @Transactional(readOnly = true)
    public PageResponse<GuideSummary> listAdmin(GuideStatus status, int page, int size) {
        PageRequest pageable = PageRequest.of(Math.max(0, page), clampSize(size));
        Page<Guide> result = status == null
                ? guideRepository.findAllByOrderByUpdatedAtDesc(pageable)
                : guideRepository.findByStatusOrderByUpdatedAtDesc(status, pageable);
        return toPage(result);
    }

    @Transactional(readOnly = true)
    public GuideDetail getById(Long id) {
        return GuideDetail.from(requireById(id));
    }

    @Transactional
    public GuideDetail create(GuideRequest request) {
        Guide guide = new Guide();
        apply(guide, request, true);
        return GuideDetail.from(guideRepository.save(guide));
    }

    @Transactional
    public GuideDetail update(Long id, GuideRequest request) {
        Guide guide = requireById(id);
        apply(guide, request, false);
        return GuideDetail.from(guideRepository.save(guide));
    }

    @Transactional
    public GuideDetail setStatus(Long id, GuideStatus status) {
        Guide guide = requireById(id);
        applyStatus(guide, status);
        return GuideDetail.from(guideRepository.save(guide));
    }

    @Transactional
    public void delete(Long id) {
        if (!guideRepository.existsById(id)) {
            throw new NotFoundException("Guide not found: " + id);
        }
        guideRepository.deleteById(id);
    }

    // ---------- internals ----------

    private Guide requireById(Long id) {
        return guideRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Guide not found: " + id));
    }

    private void apply(Guide guide, GuideRequest request, boolean creating) {
        String baseSlug = (request.slug() == null || request.slug().isBlank())
                ? Slugify.slugify(request.title())
                : Slugify.slugify(request.slug());
        guide.setSlug(uniqueSlug(baseSlug, creating ? null : guide.getId()));

        guide.setTitle(request.title().trim());
        guide.setExcerpt(blankToNull(request.excerpt()));
        guide.setBody(request.body().trim());
        guide.setTitleKo(blankToNull(request.titleKo()));
        guide.setExcerptKo(blankToNull(request.excerptKo()));
        guide.setBodyKo(blankToNull(request.bodyKo()));
        guide.setCoverImageUrl(blankToNull(request.coverImageUrl()));
        guide.setAuthorName(blankToNull(request.authorName()));
        guide.setSeoTitle(blankToNull(request.seoTitle()));
        guide.setSeoDescription(blankToNull(request.seoDescription()));
        guide.setCategory(request.categoryId() != null ? categoryService.requireById(request.categoryId()) : null);

        applyStatus(guide, request.status() != null ? request.status() : guide.getStatus());
    }

    private void applyStatus(Guide guide, GuideStatus status) {
        GuideStatus next = status == null ? GuideStatus.DRAFT : status;
        if (next == GuideStatus.PUBLISHED && guide.getPublishedAt() == null) {
            guide.setPublishedAt(Instant.now());
        }
        guide.setStatus(next);
    }

    private String uniqueSlug(String base, Long currentId) {
        String candidate = base;
        int counter = 2;
        while (currentId == null
                ? guideRepository.existsBySlug(candidate)
                : guideRepository.existsBySlugAndIdNot(candidate, currentId)) {
            candidate = base + "-" + counter++;
        }
        return candidate;
    }

    private static PageResponse<GuideSummary> toPage(Page<Guide> result) {
        return new PageResponse<>(
                result.getContent().stream().map(GuideSummary::from).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
    }

    private static int clampSize(int size) {
        return Math.max(1, Math.min(size, MAX_PAGE_SIZE));
    }

    private static String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
