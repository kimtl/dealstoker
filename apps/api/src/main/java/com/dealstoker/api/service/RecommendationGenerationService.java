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
        sb.append("Write a DealStoker editorial blurb: why we recommend this Amazon product.\n\n");
        sb.append("Rules:\n");
        sb.append("- 2-4 short paragraphs OR 1 short intro + 3-5 bullet themes (plain text, no markdown headings).\n");
        sb.append("- Synthesize common shopper themes from ratings, features, and any review snippets.\n");
        sb.append("- Do NOT invent fake quotes, usernames, star counts, or specific testimonials.\n");
        sb.append("- Do NOT copy Amazon product description verbatim.\n");
        sb.append("- Mention trade-offs briefly if obvious from the signals (e.g. polarizing size/noise).\n");
        sb.append("- Keep under 900 characters. US English. Neutral, helpful tone.\n");
        sb.append("- End without a CTA (the page already has View on Amazon).\n\n");

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
                "You write concise affiliate-friendly product recommendation blurbs for DealStoker. "
                        + "You summarize review themes without fabricating testimonials. "
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
