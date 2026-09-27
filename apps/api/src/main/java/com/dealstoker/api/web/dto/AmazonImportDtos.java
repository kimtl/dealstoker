package com.dealstoker.api.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public final class AmazonImportDtos {
    private AmazonImportDtos() {}

    public record PreviewRequest(
            @NotBlank @Size(max = 2000) String amazonUrl
    ) {}

    public record ImportRequest(
            @NotBlank @Size(max = 2000) String amazonUrl,
            @NotNull Long primaryCategoryId,
            @Size(max = 2000) String affiliateUrl,
            @Size(max = 500) String titleOverride,
            Boolean createAsDraft
    ) {}

    public record PreviewResponse(
            String asin,
            String canonicalUrl,
            String title,
            String imageUrl,
            String description,
            String brand,
            BigDecimal priceAmount,
            BigDecimal listPrice,
            String currency,
            BigDecimal rating,
            Integer reviewCount,
            List<String> features,
            String marketplace,
            boolean pageFetched,
            String note,
            boolean alreadyExists,
            Long existingProductId
    ) {}

    public record KeywordSearchRequest(
            @NotEmpty @Size(max = 8) List<@NotBlank @Size(max = 120) String> keywords,
            @DecimalMin("0") BigDecimal minPrice,
            @DecimalMin("0") BigDecimal maxPrice,
            @DecimalMin("0") @DecimalMax("95") BigDecimal minDiscountPercent,
            @DecimalMin("0") @DecimalMax("5") BigDecimal minRating,
            @Min(0) Integer minReviewCount,
            @Min(1) @Max(30) Integer maxPerKeyword,
            Boolean includeSponsored,
            Boolean includeExisting
    ) {}

    public record KeywordSearchHit(
            String asin,
            String title,
            String imageUrl,
            String productUrl,
            String keyword,
            BigDecimal priceAmount,
            BigDecimal listPrice,
            BigDecimal discountPercent,
            BigDecimal rating,
            Integer reviewCount,
            boolean sponsored,
            boolean alreadyExists,
            Long existingProductId,
            Long suggestedCategoryId,
            String suggestedCategoryName
    ) {}

    public record KeywordSearchResponse(
            List<KeywordSearchHit> items,
            int keywordCount,
            int rawHitCount,
            int matchedCount,
            List<String> notes
    ) {}

    public record KeywordRegisterItem(
            @NotBlank @Size(max = 16) String asin,
            @NotNull Long primaryCategoryId
    ) {}

    public record KeywordRegisterRequest(
            @NotEmpty @Size(max = 25) List<@Valid KeywordRegisterItem> items
    ) {}

    public record KeywordRegisterResultItem(
            String asin,
            boolean ok,
            Long productId,
            String title,
            String error
    ) {}

    public record KeywordRegisterResponse(
            int attempted,
            int created,
            int failed,
            List<KeywordRegisterResultItem> results
    ) {}
}
