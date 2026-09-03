package com.dealstoker.api.web.dto;

import jakarta.validation.constraints.NotBlank;
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
}
