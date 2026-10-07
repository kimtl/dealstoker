package com.dealstoker.api.service;

import com.dealstoker.api.domain.Category;
import com.dealstoker.api.domain.Guide;
import com.dealstoker.api.domain.GuideStatus;
import com.dealstoker.api.domain.Product;
import com.dealstoker.api.domain.ProductStatus;
import com.dealstoker.api.repository.CategoryRepository;
import com.dealstoker.api.repository.GuideRepository;
import com.dealstoker.api.repository.ProductRepository;
import com.dealstoker.api.web.dto.GuideDtos.GuideSummary;
import com.dealstoker.api.web.dto.MagazineDtos.MagazineResponse;
import com.dealstoker.api.web.dto.MagazineDtos.MagazineSection;
import com.dealstoker.api.web.dto.MagazineDtos.MagazineStory;
import com.dealstoker.api.web.dto.ProductDtos.ProductSummary;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/** Builds the guide-led homepage in one call so the web app does not fan out per guide/product. */
@Service
public class MagazineService {

    /** Same syntax as the web renderer (apps/web/src/lib/guides.ts PRODUCT_SHORTCODE). */
    static final Pattern PRODUCT_SHORTCODE =
            Pattern.compile("\\{\\{\\s*product:\\s*([a-z0-9][a-z0-9-]*)\\s*\\}\\}", Pattern.CASE_INSENSITIVE);

    static final int MAX_GUIDES = 60;
    static final int STORIES = 3;
    static final int PRODUCTS_PER_STORY = 4;
    static final int GUIDES_PER_SECTION = 2;
    static final int PRODUCTS_PER_SECTION = 4;
    static final int MORE_GUIDES = 6;

    private final GuideRepository guideRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public MagazineService(
            GuideRepository guideRepository,
            ProductRepository productRepository,
            CategoryRepository categoryRepository
    ) {
        this.guideRepository = guideRepository;
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public MagazineResponse magazine() {
        List<Guide> guides = guideRepository.findForHome(GuideStatus.PUBLISHED, PageRequest.of(0, MAX_GUIDES));
        List<Guide> storyGuides = guides.subList(0, Math.min(STORIES, guides.size()));

        // ---- stories: each guide with the products it embeds ----
        Map<Guide, List<String>> slugsByGuide = new LinkedHashMap<>();
        Set<String> allSlugs = new LinkedHashSet<>();
        for (Guide guide : storyGuides) {
            List<String> slugs = productSlugs(guide.getBody(), guide.getBodyKo());
            slugsByGuide.put(guide, slugs);
            allSlugs.addAll(slugs);
        }
        Map<String, Product> productsBySlug = allSlugs.isEmpty()
                ? Map.of()
                : productRepository.findBySlugInAndStatus(allSlugs, ProductStatus.PUBLISHED).stream()
                        .collect(Collectors.toMap(Product::getSlug, Function.identity()));

        Set<Long> shownProductIds = new HashSet<>();
        List<MagazineStory> stories = new ArrayList<>();
        for (Map.Entry<Guide, List<String>> entry : slugsByGuide.entrySet()) {
            List<Product> embedded = entry.getValue().stream()
                    .map(productsBySlug::get)
                    .filter(product -> product != null)
                    .limit(PRODUCTS_PER_STORY)
                    .toList();
            embedded.forEach(product -> shownProductIds.add(product.getId()));
            List<ProductSummary> products = embedded.stream().map(ProductSummary::from).toList();
            stories.add(new MagazineStory(GuideSummary.from(entry.getKey()), products));
        }

        // ---- category sections: remaining guides + products from that category ----
        Set<Long> storyIds = storyGuides.stream().map(Guide::getId).collect(Collectors.toSet());
        Set<Long> guideCategoryIds = new HashSet<>();
        Map<Long, List<Guide>> remainingByCategory = new LinkedHashMap<>();
        for (Guide guide : guides) {
            if (guide.getCategory() == null) {
                continue;
            }
            guideCategoryIds.add(guide.getCategory().getId());
            if (!storyIds.contains(guide.getId())) {
                remainingByCategory.computeIfAbsent(guide.getCategory().getId(), id -> new ArrayList<>()).add(guide);
            }
        }

        Set<Long> placedGuideIds = new HashSet<>(storyIds);
        List<MagazineSection> sections = new ArrayList<>();
        for (Category category : categoryRepository.findByActiveTrueOrderBySortOrderAscNameAsc()) {
            if (!guideCategoryIds.contains(category.getId())) {
                continue;
            }
            List<Guide> sectionGuides = remainingByCategory.getOrDefault(category.getId(), List.of()).stream()
                    .limit(GUIDES_PER_SECTION)
                    .toList();
            List<ProductSummary> products = productRepository
                    .findByStatusAndPrimaryCategoryIdOrderByFeaturedDescPublishedAtDesc(
                            ProductStatus.PUBLISHED, category.getId(),
                            PageRequest.of(0, PRODUCTS_PER_SECTION + shownProductIds.size()))
                    .stream()
                    .filter(product -> !shownProductIds.contains(product.getId()))
                    .limit(PRODUCTS_PER_SECTION)
                    .map(ProductSummary::from)
                    .toList();
            if (sectionGuides.isEmpty() && products.isEmpty()) {
                continue;
            }
            sectionGuides.forEach(guide -> placedGuideIds.add(guide.getId()));
            sections.add(new MagazineSection(
                    category.getId(),
                    category.getSlug(),
                    category.getName(),
                    sectionGuides.stream().map(GuideSummary::from).toList(),
                    products
            ));
        }

        List<GuideSummary> moreGuides = guides.stream()
                .filter(guide -> !placedGuideIds.contains(guide.getId()))
                .limit(MORE_GUIDES)
                .map(GuideSummary::from)
                .toList();

        return new MagazineResponse(guides.size(), stories, sections, moreGuides);
    }

    /** Unique product slugs embedded in the English body, then any extra ones in the Korean body. */
    static List<String> productSlugs(String... bodies) {
        Set<String> slugs = new LinkedHashSet<>();
        for (String body : bodies) {
            if (body == null) {
                continue;
            }
            Matcher matcher = PRODUCT_SHORTCODE.matcher(body);
            while (matcher.find()) {
                slugs.add(matcher.group(1).toLowerCase(Locale.ROOT));
            }
        }
        return List.copyOf(slugs);
    }
}
