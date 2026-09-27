package com.dealstoker.api.service;

import com.dealstoker.api.amazon.AmazonAsinParser;
import com.dealstoker.api.amazon.AmazonCrawlSupport;
import com.dealstoker.api.amazon.AmazonSearchPageFetcher;
import com.dealstoker.api.amazon.AmazonSearchPageFetcher.SearchHit;
import com.dealstoker.api.amazon.AmazonSearchPageFetcher.SearchPage;
import com.dealstoker.api.config.DealStokerProperties;
import com.dealstoker.api.domain.Product;
import com.dealstoker.api.repository.ProductRepository;
import com.dealstoker.api.web.dto.AmazonImportDtos.ImportRequest;
import com.dealstoker.api.web.dto.AmazonImportDtos.KeywordRegisterItem;
import com.dealstoker.api.web.dto.AmazonImportDtos.KeywordRegisterRequest;
import com.dealstoker.api.web.dto.AmazonImportDtos.KeywordRegisterResponse;
import com.dealstoker.api.web.dto.AmazonImportDtos.KeywordRegisterResultItem;
import com.dealstoker.api.web.dto.AmazonImportDtos.KeywordSearchHit;
import com.dealstoker.api.web.dto.AmazonImportDtos.KeywordSearchRequest;
import com.dealstoker.api.web.dto.AmazonImportDtos.KeywordSearchResponse;
import com.dealstoker.api.web.dto.CategoryDtos.CategoryResponse;
import com.dealstoker.api.web.dto.ProductDtos.ProductDetail;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class AmazonKeywordImportService {

    private static final String SOURCE = "AMAZON";

    private static final Map<String, List<String>> CATEGORY_HINTS = Map.ofEntries(
            Map.entry("electronics", List.of(
                    "headphone", "earbuds", "charger", "usb", "bluetooth", "tablet", "laptop",
                    "camera", "printer", "cable", "battery", "speaker", "phone", "monitor",
                    "keyboard", "mouse", "ssd", "router", "webcam", "3d printer", "flashforge"
            )),
            Map.entry("home-kitchen", List.of(
                    "air fryer", "kitchen", "cookware", "blender", "coffee", "vacuum", "storage",
                    "toaster", "microwave", "knife", "pan", "pot", "dish", "utensil", "ninja"
            )),
            Map.entry("outdoor-sports", List.of(
                    "camping", "hiking", "yoga", "fitness", "bike", "tent", "workout", "sports",
                    "dumbbell", "treadmill", "fishing", "cooler"
            )),
            Map.entry("beauty-personal-care", List.of(
                    "skincare", "beauty", "shampoo", "hair", "makeup", "razor", "serum", "moisturizer",
                    "sunscreen", "perfume", "grooming"
            )),
            Map.entry("health-household", List.of(
                    "vitamin", "supplement", "cleaning", "laundry", "detergent", "paper towel",
                    "toothbrush", "medicine", "first aid", "trash bag"
            )),
            Map.entry("baby", List.of(
                    "baby", "toddler", "diaper", "stroller", "infant", "pacifier", "bottle warmer"
            )),
            Map.entry("pets", List.of(
                    "dog", "cat", "pet", "aquarium", "litter", "leash", "puppy", "kitten"
            )),
            Map.entry("office-school", List.of(
                    "office", "desk", "notebook", "backpack", "stapler", "planner", "whiteboard",
                    "pen set", "school"
            )),
            Map.entry("tools-home-improvement", List.of(
                    "drill", "wrench", "screwdriver", "tool set", "smart home", "led strip",
                    "socket", "hammer", "multimeter", "saw"
            ))
    );

    private final AmazonSearchPageFetcher searchPageFetcher;
    private final AmazonImportService amazonImportService;
    private final ProductRepository productRepository;
    private final CategoryService categoryService;
    private final DealStokerProperties properties;

    public AmazonKeywordImportService(
            AmazonSearchPageFetcher searchPageFetcher,
            AmazonImportService amazonImportService,
            ProductRepository productRepository,
            CategoryService categoryService,
            DealStokerProperties properties
    ) {
        this.searchPageFetcher = searchPageFetcher;
        this.amazonImportService = amazonImportService;
        this.productRepository = productRepository;
        this.categoryService = categoryService;
        this.properties = properties;
    }

    public KeywordSearchResponse search(KeywordSearchRequest request) {
        List<String> keywords = normalizeKeywords(request.keywords());
        if (keywords.isEmpty()) {
            throw new IllegalArgumentException("Provide at least one keyword");
        }

        int maxPerKeyword = request.maxPerKeyword() == null ? 12 : request.maxPerKeyword();
        boolean includeSponsored = Boolean.TRUE.equals(request.includeSponsored());
        boolean includeExisting = Boolean.TRUE.equals(request.includeExisting());

        List<CategoryResponse> categories = categoryService.listAdmin().stream()
                .filter(CategoryResponse::active)
                .toList();
        String marketplace = normalizeMarketplace(properties.amazon().marketplace());

        Map<String, KeywordSearchHit> byAsin = new LinkedHashMap<>();
        List<String> notes = new ArrayList<>();
        int rawHitCount = 0;

        for (int i = 0; i < keywords.size(); i++) {
            String keyword = keywords.get(i);
            if (i > 0) {
                AmazonCrawlSupport.politePause(900);
            }
            SearchPage page = searchPageFetcher.search(keyword, maxPerKeyword);
            notes.add(page.note());
            rawHitCount += page.hits().size();

            for (SearchHit hit : page.hits()) {
                if (!includeSponsored && hit.sponsored()) {
                    continue;
                }
                if (!passesFilters(hit, request)) {
                    continue;
                }
                Optional<Product> existing = productRepository.findBySourceAndExternalIdAndMarketplace(
                        SOURCE, hit.asin(), marketplace
                );
                if (existing.isPresent() && !includeExisting) {
                    continue;
                }
                CategorySuggestion suggestion = suggestCategory(hit.title(), hit.keyword(), categories);
                KeywordSearchHit mapped = new KeywordSearchHit(
                        hit.asin(),
                        hit.title(),
                        hit.imageUrl(),
                        hit.productUrl(),
                        hit.keyword(),
                        hit.priceAmount(),
                        hit.listPrice(),
                        hit.discountPercent(),
                        hit.rating(),
                        hit.reviewCount(),
                        hit.sponsored(),
                        existing.isPresent(),
                        existing.map(Product::getId).orElse(null),
                        suggestion.id(),
                        suggestion.name()
                );
                byAsin.putIfAbsent(hit.asin(), mapped);
            }
        }

        List<KeywordSearchHit> items = new ArrayList<>(byAsin.values());
        items.sort(Comparator
                .comparing(KeywordSearchHit::discountPercent, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(KeywordSearchHit::rating, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(KeywordSearchHit::reviewCount, Comparator.nullsLast(Comparator.reverseOrder())));

        return new KeywordSearchResponse(
                items,
                keywords.size(),
                rawHitCount,
                items.size(),
                notes
        );
    }

    public KeywordRegisterResponse register(KeywordRegisterRequest request) {
        List<KeywordRegisterResultItem> results = new ArrayList<>();
        int created = 0;
        int failed = 0;
        int index = 0;
        for (KeywordRegisterItem item : request.items()) {
            if (index++ > 0) {
                AmazonCrawlSupport.politePause(700);
            }
            String asin = item.asin().trim().toUpperCase(Locale.ROOT);
            try {
                ProductDetail detail = amazonImportService.importProduct(new ImportRequest(
                        AmazonAsinParser.canonicalProductUrl(asin),
                        item.primaryCategoryId(),
                        null,
                        null,
                        true
                ));
                results.add(new KeywordRegisterResultItem(
                        asin, true, detail.id(), detail.title(), null
                ));
                created++;
            } catch (Exception ex) {
                results.add(new KeywordRegisterResultItem(
                        asin, false, null, null, ex.getMessage()
                ));
                failed++;
            }
        }
        return new KeywordRegisterResponse(request.items().size(), created, failed, results);
    }

    private boolean passesFilters(SearchHit hit, KeywordSearchRequest request) {
        BigDecimal minPrice = request.minPrice();
        BigDecimal maxPrice = request.maxPrice();
        if (minPrice != null && (hit.priceAmount() == null || hit.priceAmount().compareTo(minPrice) < 0)) {
            return false;
        }
        if (maxPrice != null && (hit.priceAmount() == null || hit.priceAmount().compareTo(maxPrice) > 0)) {
            return false;
        }
        BigDecimal minDiscount = request.minDiscountPercent();
        if (minDiscount != null && minDiscount.compareTo(BigDecimal.ZERO) > 0) {
            if (hit.discountPercent() == null || hit.discountPercent().compareTo(minDiscount) < 0) {
                return false;
            }
        }
        BigDecimal minRating = request.minRating();
        if (minRating != null && minRating.compareTo(BigDecimal.ZERO) > 0) {
            if (hit.rating() == null || hit.rating().compareTo(minRating) < 0) {
                return false;
            }
        }
        Integer minReviews = request.minReviewCount();
        if (minReviews != null && minReviews > 0) {
            if (hit.reviewCount() == null || hit.reviewCount() < minReviews) {
                return false;
            }
        }
        return true;
    }

    private CategorySuggestion suggestCategory(String title, String keyword, List<CategoryResponse> categories) {
        if (categories.isEmpty()) {
            return new CategorySuggestion(null, null);
        }
        String haystack = ((title == null ? "" : title) + " " + (keyword == null ? "" : keyword))
                .toLowerCase(Locale.ROOT);

        CategoryResponse best = null;
        int bestScore = -1;
        for (CategoryResponse category : categories) {
            int score = 0;
            String slug = category.slug() == null ? "" : category.slug().toLowerCase(Locale.ROOT);
            String name = category.name() == null ? "" : category.name().toLowerCase(Locale.ROOT);
            for (String token : name.replace("&", " ").split("[^a-z0-9]+")) {
                if (token.length() >= 4 && haystack.contains(token)) {
                    score += 3;
                }
            }
            List<String> hints = CATEGORY_HINTS.getOrDefault(slug, List.of());
            for (String hint : hints) {
                if (haystack.contains(hint)) {
                    score += hint.contains(" ") ? 6 : 4;
                }
            }
            if (score > bestScore) {
                bestScore = score;
                best = category;
            }
        }
        if (best == null || bestScore <= 0) {
            CategoryResponse fallback = categories.getFirst();
            return new CategorySuggestion(fallback.id(), fallback.name());
        }
        return new CategorySuggestion(best.id(), best.name());
    }

    private static List<String> normalizeKeywords(List<String> keywords) {
        Set<String> unique = new LinkedHashSet<>();
        if (keywords == null) {
            return List.of();
        }
        for (String keyword : keywords) {
            if (keyword == null) {
                continue;
            }
            String cleaned = keyword.trim().replaceAll("\\s+", " ");
            if (!cleaned.isBlank()) {
                unique.add(cleaned);
            }
            if (unique.size() >= 8) {
                break;
            }
        }
        return List.copyOf(unique);
    }

    private static String normalizeMarketplace(String marketplace) {
        if (marketplace == null || marketplace.isBlank()) {
            return "www.amazon.com";
        }
        return marketplace.trim().toLowerCase(Locale.ROOT);
    }

    private record CategorySuggestion(Long id, String name) {}
}
