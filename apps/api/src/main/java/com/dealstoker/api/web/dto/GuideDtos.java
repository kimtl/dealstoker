package com.dealstoker.api.web.dto;

import com.dealstoker.api.domain.Guide;
import com.dealstoker.api.domain.GuideStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public final class GuideDtos {
    private GuideDtos() {}

    /** Card data for lists (no body). */
    public record GuideSummary(
            Long id,
            String slug,
            String title,
            String excerpt,
            String titleKo,
            String excerptKo,
            String coverImageUrl,
            String authorName,
            Long categoryId,
            String categorySlug,
            String categoryName,
            GuideStatus status,
            Instant publishedAt,
            Instant updatedAt,
            /** Human page views, all time (admin list only; null elsewhere). */
            Long viewCount,
            /** Human page views in the last 7 days (admin list only; null elsewhere). */
            Long viewCount7d
    ) {
        public static GuideSummary from(Guide guide) {
            return from(guide, null, null);
        }

        public static GuideSummary from(Guide guide, Long viewCount, Long viewCount7d) {
            return new GuideSummary(
                    guide.getId(),
                    guide.getSlug(),
                    guide.getTitle(),
                    guide.getExcerpt(),
                    guide.getTitleKo(),
                    guide.getExcerptKo(),
                    guide.getCoverImageUrl(),
                    guide.getAuthorName(),
                    guide.getCategory() != null ? guide.getCategory().getId() : null,
                    guide.getCategory() != null ? guide.getCategory().getSlug() : null,
                    guide.getCategory() != null ? guide.getCategory().getName() : null,
                    guide.getStatus(),
                    guide.getPublishedAt(),
                    guide.getUpdatedAt(),
                    viewCount,
                    viewCount7d
            );
        }
    }

    public record GuideDetail(
            Long id,
            String slug,
            String title,
            String excerpt,
            String body,
            String titleKo,
            String excerptKo,
            String bodyKo,
            String coverImageUrl,
            String authorName,
            Long categoryId,
            String categorySlug,
            String categoryName,
            GuideStatus status,
            String seoTitle,
            String seoDescription,
            Instant publishedAt,
            Instant createdAt,
            Instant updatedAt
    ) {
        public static GuideDetail from(Guide guide) {
            return new GuideDetail(
                    guide.getId(),
                    guide.getSlug(),
                    guide.getTitle(),
                    guide.getExcerpt(),
                    guide.getBody(),
                    guide.getTitleKo(),
                    guide.getExcerptKo(),
                    guide.getBodyKo(),
                    guide.getCoverImageUrl(),
                    guide.getAuthorName(),
                    guide.getCategory() != null ? guide.getCategory().getId() : null,
                    guide.getCategory() != null ? guide.getCategory().getSlug() : null,
                    guide.getCategory() != null ? guide.getCategory().getName() : null,
                    guide.getStatus(),
                    guide.getSeoTitle(),
                    guide.getSeoDescription(),
                    guide.getPublishedAt(),
                    guide.getCreatedAt(),
                    guide.getUpdatedAt()
            );
        }
    }

    public record GuideRequest(
            @NotBlank @Size(max = 300) String title,
            @Size(max = 220) String slug,
            @Size(max = 600) String excerpt,
            @NotBlank String body,
            @Size(max = 300) String titleKo,
            @Size(max = 600) String excerptKo,
            String bodyKo,
            Long categoryId,
            String coverImageUrl,
            @Size(max = 120) String authorName,
            GuideStatus status,
            @Size(max = 255) String seoTitle,
            @Size(max = 500) String seoDescription
    ) {}

    /** AI first draft: category and/or topic, optional product slugs to embed. */
    public record GuideDraftRequest(
            Long categoryId,
            @Size(max = 300) String topic,
            List<String> productSlugs,
            String prompt
    ) {}

    public record GuideDraftResponse(String title, String excerpt, String body) {}

    public record GuideTranslateRequest(
            @Size(max = 300) String title,
            @Size(max = 600) String excerpt,
            @NotBlank String body
    ) {}

    public record GuideTranslateResponse(String titleKo, String excerptKo, String bodyKo) {}
}
