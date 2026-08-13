package com.dealstoker.api.web.dto;

import com.dealstoker.api.domain.Category;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class CategoryDtos {
    private CategoryDtos() {}

    public record CategoryResponse(
            Long id,
            Long parentId,
            String name,
            String slug,
            String description,
            String seoTitle,
            String seoDescription,
            int sortOrder,
            boolean active
    ) {
        public static CategoryResponse from(Category category) {
            return new CategoryResponse(
                    category.getId(),
                    category.getParent() != null ? category.getParent().getId() : null,
                    category.getName(),
                    category.getSlug(),
                    category.getDescription(),
                    category.getSeoTitle(),
                    category.getSeoDescription(),
                    category.getSortOrder(),
                    category.isActive()
            );
        }
    }

    public record CategoryRequest(
            Long parentId,
            @NotBlank @Size(max = 200) String name,
            @Size(max = 220) String slug,
            String description,
            @Size(max = 255) String seoTitle,
            @Size(max = 500) String seoDescription,
            Integer sortOrder,
            Boolean active
    ) {}
}
