package com.dealstoker.api.web.dto;

import com.dealstoker.api.domain.Product;
import com.dealstoker.api.domain.ProductStatus;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;

public final class ProductDtos {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private ProductDtos() {}

    public record ProductSummary(
            Long id,
            String title,
            String slug,
            String imageUrl,
            BigDecimal priceAmount,
            BigDecimal listPrice,
            String currency,
            BigDecimal rating,
            Integer reviewCount,
            String brand,
            String categorySlug,
            String categoryName,
            ProductStatus status
    ) {
        public static ProductSummary from(Product product) {
            return new ProductSummary(
                    product.getId(),
                    product.getTitle(),
                    product.getSlug(),
                    product.getImageUrl(),
                    product.getPriceAmount(),
                    product.getListPrice(),
                    product.getCurrency(),
                    product.getRating(),
                    product.getReviewCount(),
                    product.getBrand(),
                    product.getPrimaryCategory() != null ? product.getPrimaryCategory().getSlug() : null,
                    product.getPrimaryCategory() != null ? product.getPrimaryCategory().getName() : null,
                    product.getStatus()
            );
        }
    }

    public record ProductDetail(
            Long id,
            String source,
            String externalId,
            String marketplace,
            String title,
            String slug,
            String description,
            String imageUrl,
            BigDecimal priceAmount,
            String currency,
            BigDecimal listPrice,
            String availability,
            BigDecimal rating,
            Integer reviewCount,
            String detailPageUrl,
            String brand,
            List<String> features,
            ProductStatus status,
            String seoTitle,
            String seoDescription,
            Long primaryCategoryId,
            String categorySlug,
            String categoryName,
            Instant publishedAt,
            Instant lastSyncedAt
    ) {
        public static ProductDetail from(Product product) {
            return new ProductDetail(
                    product.getId(),
                    product.getSource(),
                    product.getExternalId(),
                    product.getMarketplace(),
                    product.getTitle(),
                    product.getSlug(),
                    product.getDescription(),
                    product.getImageUrl(),
                    product.getPriceAmount(),
                    product.getCurrency(),
                    product.getListPrice(),
                    product.getAvailability(),
                    product.getRating(),
                    product.getReviewCount(),
                    product.getDetailPageUrl(),
                    product.getBrand(),
                    parseFeatures(product.getFeaturesJson()),
                    product.getStatus(),
                    product.getSeoTitle(),
                    product.getSeoDescription(),
                    product.getPrimaryCategory() != null ? product.getPrimaryCategory().getId() : null,
                    product.getPrimaryCategory() != null ? product.getPrimaryCategory().getSlug() : null,
                    product.getPrimaryCategory() != null ? product.getPrimaryCategory().getName() : null,
                    product.getPublishedAt(),
                    product.getLastSyncedAt()
            );
        }
    }

    public record ProductRequest(
            @NotBlank @Size(max = 64) String externalId,
            @Size(max = 40) String source,
            @Size(max = 64) String marketplace,
            @NotBlank @Size(max = 500) String title,
            @Size(max = 540) String slug,
            String description,
            String imageUrl,
            BigDecimal priceAmount,
            @Size(max = 8) String currency,
            BigDecimal listPrice,
            @Size(max = 80) String availability,
            BigDecimal rating,
            Integer reviewCount,
            @NotBlank String detailPageUrl,
            @Size(max = 200) String brand,
            List<String> features,
            ProductStatus status,
            @Size(max = 255) String seoTitle,
            @Size(max = 500) String seoDescription,
            @NotNull Long primaryCategoryId
    ) {}

    public record PageResponse<T>(
            List<T> items,
            int page,
            int size,
            long totalElements,
            int totalPages
    ) {}

    private static List<String> parseFeatures(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return MAPPER.readValue(json, new TypeReference<>() {});
        } catch (Exception ex) {
            return Collections.emptyList();
        }
    }

    public static String writeFeatures(List<String> features) {
        if (features == null || features.isEmpty()) {
            return null;
        }
        try {
            return MAPPER.writeValueAsString(features);
        } catch (Exception ex) {
            return null;
        }
    }
}
