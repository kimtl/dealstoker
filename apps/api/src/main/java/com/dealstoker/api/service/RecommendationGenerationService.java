package com.dealstoker.api.service;

import com.dealstoker.api.amazon.AmazonAsinParser;
import com.dealstoker.api.amazon.AmazonProductPageFetcher;
import com.dealstoker.api.amazon.AmazonProductPageFetcher.ScrapedProduct;
import com.dealstoker.api.config.DealStokerProperties;
import com.dealstoker.api.domain.Product;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class RecommendationGenerationService {

    private static final Logger log = LoggerFactory.getLogger(RecommendationGenerationService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final DealStokerProperties properties;
    private final AmazonProductPageFetcher pageFetcher;
    private final RestClient restClient;

    public RecommendationGenerationService(
            DealStokerProperties properties,
            AmazonProductPageFetcher pageFetcher
    ) {
        this.properties = properties;
        this.pageFetcher = pageFetcher;
        this.restClient = RestClient.create();
    }

    public boolean isConfigured() {
        return properties.ai() != null && properties.ai().isConfigured();
    }

    public String generate(Product product) {
        if (!isConfigured()) {
            throw new IllegalArgumentException(
                    "AI is not configured. Set OPENAI_API_KEY on the API service."
            );
        }
        if (product.getTitle() == null || product.getTitle().isBlank()) {
            throw new IllegalArgumentException("Product title is required to generate a recommendation");
        }

        List<String> reviewSnippets = tryFetchReviewSnippets(product);
        String prompt = buildUserPrompt(product, reviewSnippets);
        return callChatCompletions(prompt);
    }

    private List<String> tryFetchReviewSnippets(Product product) {
        try {
            String asin = product.getExternalId();
            if (asin == null || asin.isBlank()) {
                return List.of();
            }
            String url = product.getDetailPageUrl();
            if (url == null || url.isBlank()) {
                url = AmazonAsinParser.canonicalProductUrl(asin);
            }
            ScrapedProduct scraped = pageFetcher.fetch(asin.trim(), url);
            if (scraped.reviewSnippets() == null || scraped.reviewSnippets().isEmpty()) {
                return List.of();
            }
            return scraped.reviewSnippets().stream().limit(8).toList();
        } catch (Exception ex) {
            log.info("Could not fetch review snippets for product {}: {}", product.getId(), ex.toString());
            return List.of();
        }
    }

    private String buildUserPrompt(Product product, List<String> reviewSnippets) {
        StringBuilder sb = new StringBuilder();
        sb.append("Write a DealStoker product recommendation in EXACTLY this structure (plain text, US English):\n\n");
        sb.append("One-line takeaway: <core reason in 20-40 characters worth of meaning; one punchy sentence>\n");
        sb.append("Why we recommend:\n");
        sb.append("- <strength #1 vs similar price/category — compare, numbers, or facts>\n");
        sb.append("- <strength #2 — repeated praise themes from reviews when available>\n");
        sb.append("- <optional strength #3 — e.g. price vs list / near historic low if signals support it>\n");
        sb.append("Best for: <specific shopper situation>\n");
        sb.append("Skip if / caveats: <at least one concrete downside or who should avoid it>\n");
        sb.append("Price take: <short opinion on whether the shown price looks fair/good/steep>\n\n");
        sb.append("Rules:\n");
        sb.append("- Follow the labels exactly as written above (including colons).\n");
        sb.append("- 2-3 bullets under \"Why we recommend\" (no more than 3).\n");
        sb.append("- Do NOT invent fake quotes, usernames, star counts, or testimonials.\n");
        sb.append("- Do NOT copy Amazon product description verbatim.\n");
        sb.append("- Prefer comparison/facts over hype. Keep under 1200 characters total.\n");
        sb.append("- No markdown headings. No CTA (the page already has View on Amazon).\n\n");

        sb.append("Product title: ").append(product.getTitle().trim()).append('\n');
        if (product.getBrand() != null && !product.getBrand().isBlank()) {
            sb.append("Brand: ").append(product.getBrand().trim()).append('\n');
        }
        if (product.getPrimaryCategory() != null) {
            sb.append("Category: ").append(product.getPrimaryCategory().getName()).append('\n');
        }
        if (product.getRating() != null) {
            sb.append("Average rating: ").append(product.getRating()).append(" / 5\n");
        }
        if (product.getReviewCount() != null) {
            sb.append("Review count (approx): ").append(product.getReviewCount()).append('\n');
        }
        if (product.getPriceAmount() != null) {
            sb.append("Shown price: ").append(product.getCurrency() == null ? "USD" : product.getCurrency())
                    .append(' ').append(product.getPriceAmount()).append('\n');
        }
        if (product.getListPrice() != null) {
            sb.append("List / typical price (if known): ")
                    .append(product.getCurrency() == null ? "USD" : product.getCurrency())
                    .append(' ').append(product.getListPrice()).append('\n');
        }

        List<String> features = parseFeatures(product.getFeaturesJson());
        if (!features.isEmpty()) {
            sb.append("Feature bullets:\n");
            for (String feature : features.stream().limit(8).toList()) {
                sb.append("- ").append(feature).append('\n');
            }
        }

        if (!reviewSnippets.isEmpty()) {
            sb.append("Sample review excerpts (themes only — do not quote as named people):\n");
            for (String snippet : reviewSnippets) {
                sb.append("- ").append(snippet).append('\n');
            }
        } else if (product.getDescription() != null && !product.getDescription().isBlank()) {
            String clipped = product.getDescription().trim();
            if (clipped.length() > 600) {
                clipped = clipped.substring(0, 600);
            }
            sb.append("Listing context (do not paste verbatim): ").append(clipped).append('\n');
        }

        return sb.toString();
    }

    private String callChatCompletions(String userPrompt) {
        DealStokerProperties.Ai ai = properties.ai();
        String url = ai.resolvedBaseUrl() + "/chat/completions";

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", ai.resolvedModel());
        body.put("temperature", 0.5);
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of(
                "role", "system",
                "content",
                "You write structured affiliate-friendly product recommendations for DealStoker. "
                        + "Always use the exact section labels requested by the user. "
                        + "Summarize review themes without fabricating testimonials. "
                        + "Output plain text only."
        ));
        messages.add(Map.of("role", "user", "content", userPrompt));
        body.put("messages", messages);

        try {
            String raw = restClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + ai.apiKey().trim())
                    .body(body)
                    .retrieve()
                    .body(String.class);

            return extractContent(raw);
        } catch (RestClientResponseException ex) {
            log.warn("OpenAI recommendation failed status={}: {}", ex.getStatusCode().value(), ex.getResponseBodyAsString());
            throw new IllegalArgumentException(
                    "AI request failed (" + ex.getStatusCode().value() + "). Check OPENAI_API_KEY / model."
            );
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("OpenAI recommendation failed: {}", ex.toString());
            throw new IllegalArgumentException("AI request failed: " + ex.getMessage());
        }
    }

    private static String extractContent(String raw) throws Exception {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("AI returned an empty response");
        }
        JsonNode root = MAPPER.readTree(raw);
        JsonNode content = root.path("choices").path(0).path("message").path("content");
        if (content.isMissingNode() || content.asText().isBlank()) {
            throw new IllegalArgumentException("AI returned no recommendation text");
        }
        String text = content.asText().trim();
        if (text.length() > 4000) {
            text = text.substring(0, 4000);
        }
        return text;
    }

    private static List<String> parseFeatures(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return MAPPER.readValue(json, MAPPER.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (Exception ex) {
            return List.of();
        }
    }
}
