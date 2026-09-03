package com.dealstoker.api.service;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryService categoryService;
    private final ClickEventRepository clickEventRepository;
    private final PageViewEventRepository pageViewEventRepository;

    public ProductService(
            ProductRepository productRepository,
            CategoryService categoryService,
            ClickEventRepository clickEventRepository,
            PageViewEventRepository pageViewEventRepository
    ) {
        this.productRepository = productRepository;
        this.categoryService = categoryService;
        this.clickEventRepository = clickEventRepository;
        this.pageViewEventRepository = pageViewEventRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductSummary> listPublished(String categorySlug, String q, String sort, int page, int size) {
        Long categoryId = null;
        if (categorySlug != null && !categorySlug.isBlank()) {
            categoryId = categoryService.requireBySlug(categorySlug).getId();
        }
        Sort sortSpec = resolveSort(sort);
        Page<Product> result = productRepository.searchPublished(
                ProductStatus.PUBLISHED,
                categoryId,
                blankToNull(q),
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
                ? productRepository.findTop12ByStatusOrderByPublishedAtDesc(ProductStatus.PUBLISHED)
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
        return productRepository.findTop12ByStatusOrderByPublishedAtDesc(ProductStatus.PUBLISHED).stream()
                .limit(limit)
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

    @Transactional(readOnly = true)
    public List<ProductSummary> topBuyPublished(int limit) {
        List<Product> products = productRepository.findTopByBuyClicks(
                ProductStatus.PUBLISHED.name(),
                Math.max(1, Math.min(limit, 20))
        );
        if (products.isEmpty()) {
            return List.of();
        }
        List<Long> ids = products.stream().map(Product::getId).toList();
        Map<Long, Long> counts = clickEventRepository.countByProductIds(ids).stream()
                .collect(Collectors.toMap(
                        row -> ((Number) row[0]).longValue(),
                        row -> ((Number) row[1]).longValue()
                ));
        return products.stream()
                .map(product -> ProductSummary.from(product, counts.getOrDefault(product.getId(), 0L)))
                .toList();
    }

    @Transactional
    public ProductDetail create(ProductRequest request) {
        Product product = new Product();
        apply(product, request, true);
        return ProductDetail.from(productRepository.save(product));
    }

    @Transactional
    public ProductDetail update(Long id, ProductRequest request) {
        Product product = requireById(id);
        apply(product, request, false);
        return ProductDetail.from(productRepository.save(product));
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

    private void apply(Product product, ProductRequest request, boolean creating) {
        String source = blankToDefault(request.source(), "AMAZON");
        String marketplace = blankToDefault(request.marketplace(), "www.amazon.com");
        String slug = (request.slug() == null || request.slug().isBlank())
                ? uniqueSlug(Slugify.slugify(request.title()), creating ? null : product.getId())
                : uniqueSlug(Slugify.slugify(request.slug()), creating ? null : product.getId());

        if (creating) {
            if (productRepository.existsBySourceAndExternalIdAndMarketplace(source, request.externalId(), marketplace)) {
                throw new ConflictException("Product already exists for ASIN/marketplace");
            }
        } else if (productRepository.existsBySourceAndExternalIdAndMarketplaceAndIdNot(
                source, request.externalId(), marketplace, product.getId())) {
            throw new ConflictException("Product already exists for ASIN/marketplace");
        }

        Category category = categoryService.requireById(request.primaryCategoryId());
        ProductStatus status = request.status() != null ? request.status() : ProductStatus.DRAFT;

        product.setSource(source);
        product.setExternalId(request.externalId().trim());
        product.setMarketplace(marketplace);
        product.setTitle(request.title().trim());
        product.setSlug(slug);
        product.setDescription(request.description());
        product.setImageUrl(request.imageUrl());
        product.setPriceAmount(request.priceAmount());
        product.setCurrency(blankToDefault(request.currency(), "USD"));
        product.setListPrice(request.listPrice());
        product.setAvailability(request.availability());
        product.setRating(request.rating());
        product.setReviewCount(request.reviewCount());
        product.setDetailPageUrl(request.detailPageUrl().trim());
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
        product.setLastSyncedAt(Instant.now());
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
        if ("price_asc".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Direction.ASC, "priceAmount");
        }
        if ("price_desc".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Direction.DESC, "priceAmount");
        }
        if ("rating".equalsIgnoreCase(sort)) {
            return Sort.by(Sort.Direction.DESC, "rating");
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
            clickCounts = clickEventRepository.countByProductIds(ids).stream()
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

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String blankToDefault(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value.trim();
    }
}
