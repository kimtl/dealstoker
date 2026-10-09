package com.dealstoker.api.service;

import com.dealstoker.api.amazon.AmazonProductPageFetcher;
import com.dealstoker.api.config.DealStokerProperties;
import com.dealstoker.api.domain.Product;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class RecommendationGenerationServiceTest {

    private final RecommendationGenerationService service = new RecommendationGenerationService(
            mock(DealStokerProperties.class), mock(AmazonProductPageFetcher.class), "");

    private static Product product(String title) {
        Product product = new Product();
        product.setTitle(title);
        product.setPriceAmount(new BigDecimal("79.99"));
        product.setRating(new BigDecimal("4.6"));
        product.setReviewCount(21000);
        return product;
    }

    @Test
    void promptAsksForNaturalProseWithoutTheOldLabels() {
        String prompt = service.buildUserPrompt(product("COSORI Air Fryer"), List.of(), null);

        assertThat(prompt)
                .contains("two or three short paragraphs")
                .contains("No headings, no labels")
                .contains("single sentence that works on its own")
                .doesNotContain("One-line takeaway:")
                .doesNotContain("Price take:");
        assertThat(RecommendationGenerationService.ANGLES).anyMatch(prompt::contains);
    }

    @Test
    void reviewThemesAreAttributedToOwnersAndNotesToTheEditor() {
        String prompt = service.buildUserPrompt(product("COSORI Air Fryer"),
                List.of("Basket is easy to clean", "Fan is louder than expected"),
                "I use the 5.8 qt model for two people.");

        assertThat(prompt)
                .contains("attributed to owners or buyers")
                .contains("Fan is louder than expected")
                .contains("Editor notes (first-hand")
                .contains("I use the 5.8 qt model for two people.");
    }

    @Test
    void systemPromptForbidsInventedExperience() {
        assertThat(RecommendationGenerationService.SYSTEM_PROMPT)
                .contains("never claim that you, DealStoker or \"we\" bought, tested, owned or used")
                .doesNotContain("\\");
    }

    @Test
    void anglesVaryAcrossProducts() {
        Set<String> angles = new HashSet<>();
        for (int i = 0; i < 12; i++) {
            angles.add(RecommendationGenerationService.angleFor(product("Product " + i)));
        }
        assertThat(angles.size()).isGreaterThan(1);
    }

    @Test
    void cleanUpRemovesStrayHeadingsBulletsAndBold() {
        String raw = "Why we recommend it:\n\nA solid **pick** for small kitchens.\n\n\n- It heats fast.\n";
        assertThat(RecommendationGenerationService.cleanUp(raw))
                .isEqualTo("A solid pick for small kitchens.\n\nIt heats fast.");
    }
}
