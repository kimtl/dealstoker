package com.dealstoker.api.web.dto;

import com.dealstoker.api.domain.Category;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class CategoryDtos {
    private CategoryDtos() {}

    public record CategoryResponse(
            Long id,
            Long parentId,
            String name,
            String slug,
            String description,
            String buyingGuide,
            String seoTitle,
            String seoDescription,
            int sortOrder,
            boolean active,
            Instant updatedAt
    ) {
        public static CategoryResponse from(Category category) {
            return new CategoryResponse(
                    category.getId(),
                    category.getParent() != null ? category.getParent().getId() : null,
                    category.getName(),
                    category.getSlug(),
                    category.getDescription(),
                    category.getBuyingGuide(),
                    category.getSeoTitle(),
                    category.getSeoDescription(),
                    category.getSortOrder(),
                    category.isActive(),
                    category.getUpdatedAt()
            );
        }
    }

    public record CategoryRequest(
            Long parentId,
            @NotBlank @Size(max = 200) String name,
            @Size(max = 220) String slug,
            String description,
            String buyingGuide,
            @Size(max = 255) String seoTitle,
            @Size(max = 500) String seoDescription,
            Integer sortOrder,
            Boolean active
    ) {}

    public record BuyingGuideGenerateRequest(
            String prompt
    ) {}

    public record BuyingGuideGenerateResponse(
            String buyingGuide
    ) {}
}
