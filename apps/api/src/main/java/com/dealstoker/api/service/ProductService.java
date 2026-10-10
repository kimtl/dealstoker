package com.dealstoker.api.service;

import com.dealstoker.api.affiliate.AffiliateLinkBuilder;
import com.dealstoker.api.domain.Category;
import com.dealstoker.api.domain.Product;
import com.dealstoker.api.domain.ProductStatus;
import com.dealstoker.api.repository.ClickEventRepository;
import com.dealstoker.api.repository.PageViewEventRepository;
import com.dealstoker.api.repository.ProductRepository;
import com.dealstoker.api.util.Slugify;
import com.dealstoker.api.web.ApiExceptionHandler.ConflictException;
import com.dealstoker.api.web.ApiExceptionHandler.NotFoundException;
import com.dealstoker.api.web.dto.ProductDtos;
import com.dealstoker.api.web.dto.ProductDtos.FeatureRequest;
import com.dealstoker.api.web.dto.ProductDtos.PageResponse;
import com.dealstoker.api.web.dto.ProductDtos.ProductDetail;
import com.dealstoker.api.web.dto.ProductDtos.ProductRequest;
import com.dealstoker.api.web.dto.ProductDtos.ProductSummary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.JpaSort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryService categoryService;
    private final ClickEventRepository clickEventRepository;
    private final PageViewEventRepository pageViewEventRepository;
    private final AffiliateLinkBuilder affiliateLinkBuilder;

    public ProductService(
            ProductRepository productRepository,
            CategoryService categoryService,
            ClickEventRepository clickEventRepository,
            PageViewEventRepository pageViewEventRepository,
            AffiliateLinkBuilder affiliateLinkBuilder
    ) {
        this.productRepository = productRepository;
        this.categoryService = categoryService;
        this.clickEventRepository = clickEventRepository;
        this.pageViewEventRepository = pageViewEventRepository;
        this.affiliateLinkBuilder = affiliateLinkBuilder;
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductSummary> listPublished(
            String categorySlug,
            String q,
            String sort,
            int page,
            int size
    ) {
        return listPublished(categorySlug, q, sort, page, size, null, null);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductSummary> listPublished(
            String categorySlug,
            String q,
            String sort,
            int page,
            int size,
            BigDecimal minPrice,
            BigDecimal maxPrice
    ) {
        Long categoryId = null;
        if (categorySlug != null && !categorySlug.isBlank()) {
            categoryId = categoryService.requireBySlug(categorySlug).getId();
        }
        BigDecimal effectiveMin = sanitizePrice(minPrice);
        BigDecimal effectiveMax = sanitizePrice(maxPrice);
        if (effectiveMin != null && effectiveMax != null && effectiveMin.compareTo(effectiveMax) > 0) {
            BigDecimal swap = effectiveMin;
            effectiveMin = effectiveMax;
            effectiveMax = swap;
        }
        Sort sortSpec = resolveSort(sort);
        Page<Product> result = productRepository.searchPublished(
                ProductStatus.PUBLISHED,
                categoryId,
                blankToNull(q),
                effectiveMin,
                effectiveMax,
                PageRequest.of(page, size, sortSpec)
        );
        return toPage(result);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductSummary> listAdmin(ProductStatus status, int page, int size) {
        Page<Product> result = status == null
                ? productRepository.findAll(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt")))
                : productRepository.findByStatus(status, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt")));
        return toAdminPage(result);
    }

    @Transactional(readOnly = true)
    public ProductDetail getPublishedBySlug(String slug) {
        Product product = productRepository.findBySlugAndStatus(slug, ProductStatus.PUBLISHED)
                .orElseThrow(() -> new NotFoundException("Product not found: " + slug));
        return ProductDetail.from(product);
    }

    @Transactional(readOnly = true)
    public ProductDetail getAdminById(Long id) {
        return ProductDetail.from(requireById(id));
    }

    @Transactional(readOnly = true)
    public Product requireBySlug(String slug) {
        return productRepository.findBySlug(slug)
                .orElseThrow(() -> new NotFoundException("Product not found: " + slug));
    }

    @Transactional(readOnly = true)
    public Product requireById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Product not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<ProductSummary> related(String slug) {
        Product product = productRepository.findBySlugAndStatus(slug, ProductStatus.PUBLISHED)
                .orElseThrow(() -> new NotFoundException("Product not found: " + slug));
        Long categoryId = product.getPrimaryCategory() != null ? product.getPrimaryCategory().getId() : null;
        List<Product> related = categoryId == null
                ? productRepository.findByStatusOrderByPublishedAtDesc(ProductStatus.PUBLISHED, PageRequest.of(0, 12))
                : productRepository.findTop12ByStatusAndPrimaryCategoryIdAndIdNotOrderByPublishedAtDesc(
                        ProductStatus.PUBLISHED, categoryId, product.getId());
        return related.stream()
                .filter(p -> !p.getId().equals(product.getId()))
                .limit(6)
                .map(ProductSummary::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductSummary> latestPublished(int limit) {
        int size = Math.max(1, Math.min(limit, 200));
        return productRepository.findByStatusOrderByPublishedAtDesc(ProductStatus.PUBLISHED, PageRequest.of(0, size))
                .stream()
                .map(ProductSummary::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProductSummary> recommendedPublished(int limit) {
        return productRepository
                .findTop5ByStatusAndFeaturedTrueOrderByFeaturedRankAscPublishedAtDesc(ProductStatus.PUBLISHED)
                .stream()
                .limit(limit)
                .map(ProductSummary::from)
                .toList();
    }

    /** Rolling window for the homepage "Top views" ranking. */
    public static final int TOP_VIEWS_WINDOW_DAYS = 7;

    /**
     * Most-viewed published products over the last {@link #TOP_VIEWS_WINDOW_DAYS} days.
     * Falls back to all-time views when the window is empty, and returns an empty
     * list (the UI shows its "no views yet" message) when nothing was ever viewed.
     */
    @Transactional(readOnly = true)
    public List<ProductSummary> topViewPublished(int limit) {
        int size = Math.max(1, Math.min(limit, 20));
        Instant since = Instant.now().minus(TOP_VIEWS_WINDOW_DAYS, java.time.temporal.ChronoUnit.DAYS);
        List<Product> products = productRepository.findTopByPageViewsSince(
                ProductStatus.PUBLISHED.name(), since, size);
        if (products.isEmpty()) {
            since = Instant.EPOCH;
            products = productRepository.findTopByPageViewsSince(
                    ProductStatus.PUBLISHED.name(), since, size);
        }
        if (products.isEmpty()) {
            return List.of();
        }
        List<Long> ids = products.stream().map(Product::getId).toList();
        Map<Long, Long> counts = pageViewEventRepository
                .countByProductIdsSince(ids, since)
                .stream()
                .collect(Collectors.toMap(
                        row -> ((Number) row[0]).longValue(),
                        row -> ((Number) row[1]).longValue()
                ));
        return products.stream()
                .map(product -> ProductSummary.from(
                        product,
                        null,
                        counts.getOrDefault(product.getId(), 0L)
                ))
                .toList();
    }

    @Transactional
    public ProductDetail create(ProductRequest request) {
        Product product = new Product();
        boolean priceChanged = apply(product, request, true);
        return ProductDetail.from(saveAndRecordPrice(product, priceChanged));
    }

    @Transactional
    public ProductDetail update(Long id, ProductRequest request) {
        Product product = requireById(id);
        boolean priceChanged = apply(product, request, false);
        return ProductDetail.from(saveAndRecordPrice(product, priceChanged));
    }

    /** Saves the product and, when its price was just set, adds it to the price history. */
    private Product saveAndRecordPrice(Product product, boolean priceChanged) {
        Product saved = productRepository.save(product);
        if (priceChanged && saved.getPriceAmount() != null) {
            productRepository.recordPriceToday(saved.getId());
        }
        return saved;
    }

    @Transactional
    public ProductDetail publish(Long id) {
        Product product = requireById(id);
        validatePublishable(product);
        product.setStatus(ProductStatus.PUBLISHED);
        if (product.getPublishedAt() == null) {
            product.setPublishedAt(Instant.now());
        }
        return ProductDetail.from(productRepository.save(product));
    }

    @Transactional
    public ProductDetail unpublish(Long id) {
        Product product = requireById(id);
        product.setStatus(ProductStatus.UNPUBLISHED);
        return ProductDetail.from(productRepository.save(product));
    }

    @Transactional
    public ProductDetail updateFeatured(Long id, FeatureRequest request) {
        Product product = requireById(id);
        if (request.featured() != null) {
            product.setFeatured(request.featured());
        }
        if (request.featuredRank() != null) {
            product.setFeaturedRank(Math.max(0, request.featuredRank()));
        }
        if (product.isFeatured() && product.getFeaturedRank() == 0) {
            product.setFeaturedRank(100);
        }
        return ProductDetail.from(productRepository.save(product));
    }

    @Transactional
    public ProductDetail saveRecommendation(Long id, String recommendation) {
        Product product = requireById(id);
        product.setRecommendation(blankToNull(recommendation));
        return ProductDetail.from(productRepository.save(product));
    }

    @Transactional(readOnly = true)
    public Product requireByIdWithCategory(Long id) {
        Product product = requireById(id);
        if (product.getPrimaryCategory() != null) {
            product.getPrimaryCategory().getName();
        }
        return product;
    }

    /** Missing notes first; with rewriteTemplated, also published notes still on the old template. */
    @Transactional(readOnly = true)
    public List<Product> listRecommendationTargets(int limit, boolean rewriteTemplated) {
        int size = Math.max(1, Math.min(limit, 50));
        List<Product> products = new ArrayList<>(listMissingRecommendation(size));
        if (rewriteTemplated && products.size() < size) {
            for (Product product : productRepository.findTemplatedRecommendation(
                    ProductStatus.PUBLISHED, PageRequest.of(0, size - products.size()))) {
                if (product.getPrimaryCategory() != null) {
                    product.getPrimaryCategory().getName();
                }
                products.add(product);
            }
        }
        return products;
    }

    @Transactional(readOnly = true)
    public List<Product> listMissingRecommendation(int limit) {
        List<Product> products = productRepository.findMissingRecommendation(
                PageRequest.of(0, Math.max(1, Math.min(limit, 50)))
        );
        for (Product product : products) {
            if (product.getPrimaryCategory() != null) {
                product.getPrimaryCategory().getName();
            }
        }
        return products;
    }

    @Transactional
    public void delete(Long id) {
        if (!productRepository.existsById(id)) {
            throw new NotFoundException("Product not found: " + id);
        }
        productRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public long countPublished() {
        return productRepository.countByStatus(ProductStatus.PUBLISHED);
    }

    /** Copies the request onto the product; true when the price was (re)set and counts as checked now. */
    private boolean apply(Product product, ProductRequest request, boolean creating) {
        String source = blankToDefault(request.source(), "AMAZON");
        String marketplace = blankToDefault(request.marketplace(), "www.amazon.com");
        String slug = (request.slug() == null || request.slug().isBlank())
                ? uniqueSlug(Slugify.slugify(request.title()), creating ? null : product.getId())
                : uniqueSlug(Slugify.slugify(request.slug()), creating ? null : product.getId());

        String externalId = request.externalId().trim();
        if (creating) {
            if (productRepository.existsBySourceAndExternalIdAndMarketplace(source, externalId, marketplace)) {
                throw new ConflictException("Product already exists for ASIN/marketplace");
            }
        } else if (productRepository.existsBySourceAndExternalIdAndMarketplaceAndIdNot(
                source, externalId, marketplace, product.getId())) {
            throw new ConflictException("Product already exists for ASIN/marketplace");
        }

        Category category = categoryService.requireById(request.primaryCategoryId());
        ProductStatus status = request.status() != null ? request.status() : ProductStatus.DRAFT;

        product.setSource(source);
        product.setExternalId(externalId);
        product.setMarketplace(marketplace);
        product.setTitle(request.title().trim());
        product.setSlug(slug);
        product.setDescription(request.description());
        product.setRecommendation(blankToNull(request.recommendation()));
        product.setImageUrl(request.imageUrl());
        BigDecimal listPrice = request.listPrice();
        if (listPrice != null && request.priceAmount() != null
                && listPrice.compareTo(request.priceAmount()) <= 0) {
            listPrice = null;
        }
        // A price typed in (or imported) now counts as checked now.
        boolean priceChanged = creating
                || !sameAmount(product.getPriceAmount(), request.priceAmount())
                || !sameAmount(product.getListPrice(), listPrice);
        if (priceChanged) {
            product.setLastSyncedAt(Instant.now());
        }
        product.setPriceAmount(request.priceAmount());
        product.setCurrency(blankToDefault(request.currency(), "USD"));
        product.setListPrice(listPrice);
        product.setAvailability(request.availability());
        product.setRating(request.rating());
        product.setReviewCount(request.reviewCount());
        product.setDetailPageUrl(affiliateLinkBuilder.buildOutboundUrl(
                request.detailPageUrl().trim(),
                request.externalId()
        ));
        product.setBrand(request.brand());
        product.setFeaturesJson(ProductDtos.writeFeatures(request.features()));
        product.setSeoTitle(request.seoTitle());
        product.setSeoDescription(request.seoDescription());
        product.setPrimaryCategory(category);
        product.setStatus(status);
        product.setFeatured(Boolean.TRUE.equals(request.featured()));
        product.setFeaturedRank(request.featuredRank() != null ? Math.max(0, request.featuredRank()) : 0);
        if (product.isFeatured() && product.getFeaturedRank() == 0) {
            product.setFeaturedRank(100);
        }
        if (status == ProductStatus.PUBLISHED) {
            validatePublishable(product);
            if (product.getPublishedAt() == null) {
                product.setPublishedAt(Instant.now());
            }
        }
        return priceChanged;
    }

    private String uniqueSlug(String base, Long currentId) {
        String candidate = base;
        int i = 2;
        while (true) {
            boolean exists = currentId == null
                    ? productRepository.existsBySlug(candidate)
                    : productRepository.existsBySlugAndIdNot(candidate, currentId);
            if (!exists) {
                return candidate;
            }
            candidate = base + "-" + i;
            i++;
        }
    }

    private void validatePublishable(Product product) {
        if (product.getTitle() == null || product.getTitle().isBlank()) {
            throw new IllegalArgumentException("Published product requires title");
        }
        if (product.getImageUrl() == null || product.getImageUrl().isBlank()) {
            throw new IllegalArgumentException("Published product requires imageUrl");
        }
        if (product.getDetailPageUrl() == null || product.getDetailPageUrl().isBlank()) {
            throw new IllegalArgumentException("Published product requires detailPageUrl");
        }
        if (product.getPrimaryCategory() == null) {
            throw new IllegalArgumentException("Published product requires primaryCategory");
        }
    }

    private Sort resolveSort(String sort) {
        if (sort == null || sort.isBlank() || "newest".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Direction.DESC, "publishedAt");
        }
        // Postgres sorts NULLs first on DESC; products without a price/rating
        // (common for keyword imports) must not float to the top.
        if ("price_asc".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Order.asc("priceAmount").nullsLast(), Sort.Order.desc("publishedAt"));
        }
        if ("price_desc".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Order.desc("priceAmount").nullsLast(), Sort.Order.desc("publishedAt"));
        }
        if ("discount".equalsIgnoreCase(sort)) {
            // Biggest saving vs. list price first; items without a list price count as 0%.
            return JpaSort.unsafe(Sort.Direction.DESC,
                            "COALESCE((p.listPrice - p.priceAmount) / p.listPrice, 0)")
                    .and(Sort.by(Sort.Direction.DESC, "publishedAt"));
        }
        if ("rating".equalsIgnoreCase(sort)) {
            return Sort.by(
                    Sort.Order.desc("rating").nullsLast(),
                    Sort.Order.desc("reviewCount").nullsLast(),
                    Sort.Order.desc("publishedAt")
            );
        }
        return Sort.by(Sort.Direction.DESC, "publishedAt");
    }

    private PageResponse<ProductSummary> toPage(Page<Product> page) {
        return new PageResponse<>(
                page.getContent().stream().map(ProductSummary::from).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }

    private PageResponse<ProductSummary> toAdminPage(Page<Product> page) {
        List<Long> ids = page.getContent().stream().map(Product::getId).toList();
        Map<Long, Long> clickCounts = Map.of();
        Map<Long, Long> viewCounts = Map.of();
        if (!ids.isEmpty()) {
            clickCounts = clickEventRepository.countHumanClicksByProductIds(ids).stream()
                    .collect(Collectors.toMap(
                            row -> ((Number) row[0]).longValue(),
                            row -> ((Number) row[1]).longValue()
                    ));
            Instant epoch = Instant.EPOCH;
            viewCounts = pageViewEventRepository.countByProductIdsSince(ids, epoch).stream()
                    .collect(Collectors.toMap(
                            row -> ((Number) row[0]).longValue(),
                            row -> ((Number) row[1]).longValue()
                    ));
        }
        Map<Long, Long> finalClickCounts = clickCounts;
        Map<Long, Long> finalViewCounts = viewCounts;
        return new PageResponse<>(
                page.getContent().stream()
                        .map(product -> ProductSummary.from(
                                product,
                                finalClickCounts.getOrDefault(product.getId(), 0L),
                                finalViewCounts.getOrDefault(product.getId(), 0L)
                        ))
                        .toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }

    private static boolean sameAmount(BigDecimal a, BigDecimal b) {
        if (a == null || b == null) {
            return a == b;
        }
        return a.compareTo(b) == 0;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private BigDecimal sanitizePrice(BigDecimal value) {
        if (value == null) {
            return null;
        }
        if (value.compareTo(BigDecimal.ZERO) < 0) {
            return BigDecimal.ZERO;
        }
        // Guard absurd values from query spam.
        BigDecimal max = new BigDecimal("1000000");
        return value.compareTo(max) > 0 ? max : value;
    }

    private String blankToDefault(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value.trim();
    }
}
