package com.dealstoker.api.web.dto;

import com.dealstoker.api.web.dto.GuideDtos.GuideSummary;
import com.dealstoker.api.web.dto.ProductDtos.ProductSummary;

import java.util.List;

/** Guide-led homepage: lead stories with the products they recommend, then category sections. */
public final class MagazineDtos {
    private MagazineDtos() {}

    /** A guide plus the published products its body embeds via {{product:slug}}, in body order. */
    public record MagazineStory(GuideSummary guide, List<ProductSummary> products) {}

    public record MagazineSection(
            Long categoryId,
            String categorySlug,
            String categoryName,
            List<GuideSummary> guides,
            List<ProductSummary> products
    ) {}

    public record MagazineResponse(
            long publishedGuides,
            List<MagazineStory> stories,
            List<MagazineSection> sections,
            /** Published guides not shown above (uncategorized or overflow). */
            List<GuideSummary> moreGuides
    ) {}
}
