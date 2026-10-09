package com.dealstoker.api.service;

import com.dealstoker.api.amazon.AmazonAsinParser;
import com.dealstoker.api.amazon.AmazonProductPageFetcher;
import com.dealstoker.api.amazon.AmazonProductPageFetcher.ScrapedProduct;
import com.dealstoker.api.config.DealStokerProperties;
import com.dealstoker.api.domain.Product;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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
    private static final JsonMapper MAPPER = JsonMapper.builder().build();

    private final DealStokerProperties properties;
    private final AmazonProductPageFetcher pageFetcher;
    private final RestClient restClient;
    /** Optional stronger model for writing (shared with guides, OPENAI_GUIDE_MODEL). */
    private final String writingModel;

    public RecommendationGenerationService(
            DealStokerProperties properties,
            AmazonProductPageFetcher pageFetcher,
            @Value("${dealstoker.ai.guide-model:}") String writingModel
    ) {
        this.properties = properties;
        this.pageFetcher = pageFetcher;
        this.restClient = AiRestClients.create();
        this.writingModel = writingModel == null || writingModel.isBlank() ? null : writingModel.trim();
    }

    public boolean isConfigured() {
        return properties.ai() != null && properties.ai().isConfigured();
    }

    public String generate(Product product) {
        return generate(product, null);
    }

    /**
     * @param editorNotes optional first-hand notes from the editor; the only source the write-up
     *                    may present as personal experience.
     */
    public String generate(Product product, String editorNotes) {
        if (!isConfigured()) {
            throw new IllegalArgumentException(
                    "AI is not configured. Set OPENAI_API_KEY on the API service."
            );
        }
        if (product.getTitle() == null || product.getTitle().isBlank()) {
            throw new IllegalArgumentException("Product title is required to generate a recommendation");
        }

        List<String> reviewSnippets = tryFetchReviewSnippets(product);
        String prompt = buildUserPrompt(product, reviewSnippets, editorNotes);
        return cleanUp(callChatCompletions(prompt));
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

    /**
     * Opening angles, picked per product, so recommendations across the catalog don't all start
     * and flow the same way.
     */
    static final List<String> ANGLES = List.of(
            "Open with the everyday situation this product fits (who reaches for it, and when).",
            "Open with the one trade-off a shopper should understand before buying it.",
            "Open with what owners keep bringing up in their reviews, good or bad.",
            "Open with how it compares to the cheaper or pricier way to solve the same problem.",
            "Open with the detail most people overlook when choosing this kind of product.",
            "Open with whether the current price makes it worth buying now or waiting."
    );

    static String angleFor(Product product) {
        long seed = product.getId() != null ? product.getId()
                : (product.getTitle() == null ? 0 : product.getTitle().hashCode());
        return ANGLES.get((int) Math.floorMod(seed, (long) ANGLES.size()));
    }

    static final String SYSTEM_PROMPT = """
            You write the short "Why we recommend it" note on DealStoker product pages. DealStoker is \
            a small independent site helping US shoppers decide what to buy on Amazon.com. Write like a \
            knowledgeable friend: specific, plain-spoken, a little opinionated, never salesy.

            Honesty rules (strict): never claim that you, DealStoker or "we" bought, tested, owned or \
            used the product, and never invent anecdotes, quotes, numbers or what reviewers say. \
            Experience-based detail may only come from (a) the review excerpts, described as what \
            owners or buyers report, or (b) the editor notes, written in first person as the editor's \
            own experience. Product facts come only from the data given. Output plain text only.
            """;

    String buildUserPrompt(Product product, List<String> reviewSnippets, String editorNotes) {
        StringBuilder sb = new StringBuilder();
        sb.append("Write the recommendation note for the product below.\n\n");
        sb.append("Format:\n");
        sb.append("- 120 to 200 words in two or three short paragraphs. No headings, no labels, no bullet lists.\n");
        sb.append("- The first paragraph is a single sentence that works on its own as the takeaway ");
        sb.append("(it is also used as the page summary).\n");
        sb.append("- ").append(angleFor(product)).append('\n');
        sb.append("- Say who it suits and give at least one concrete reason someone should skip it.\n");
        sb.append("- Mention the price only if it helps the decision; never call a price current.\n\n");
        sb.append("Voice:\n");
        sb.append("- Second person, contractions, varied sentence length. Concrete details over adjectives ");
        sb.append("(sizes, capacities, what it feels like to use day to day when the data supports it).\n");
        sb.append("- Avoid stock phrases: \"game-changer\", \"look no further\", \"whether you're a\", ");
        sb.append("\"elevate\", \"seamless\", \"must-have\", \"top-notch\", \"boasts\", \"in conclusion\", ");
        sb.append("\"when it comes to\", \"overall\". No exclamation marks, no emojis, no call to action.\n");
        if (!reviewSnippets.isEmpty()) {
            sb.append("- Use the review excerpts for lived-in detail, attributed to owners or buyers ");
            sb.append("(e.g. \"owners mention\", \"a common complaint is\"), never as quotes from named people.\n");
        }
        sb.append('\n');
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

        if (product.getRecommendation() != null && !product.getRecommendation().isBlank()) {
            String previous = product.getRecommendation().trim();
            sb.append("Previous note (rewrite it in the new style; keep only supported facts): ")
                    .append(previous.length() > 1200 ? previous.substring(0, 1200) : previous).append('\n');
        }
        if (editorNotes != null && !editorNotes.isBlank()) {
            sb.append("Editor notes (first-hand; may be written in first person as the editor's own experience): ")
                    .append(editorNotes.trim()).append('\n');
        }

        if (!reviewSnippets.isEmpty()) {
            sb.append("Review excerpts from buyers (themes only; do not quote as named people):\n");
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
        body.put("model", writingModel != null ? writingModel : ai.resolvedModel());
        body.put("temperature", 0.8);
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));
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
        if (content.isMissingNode() || content.asString("").isBlank()) {
            throw new IllegalArgumentException("AI returned no recommendation text");
        }
        String text = content.asString().trim();
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
            return MAPPER.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception ex) {
            return List.of();
        }
    }

    /** Strips stray headings/labels the model sometimes adds and normalises blank lines. */
    static String cleanUp(String text) {
        if (text == null) {
            return null;
        }
        String cleaned = text.trim()
                .replaceAll("(?im)^[ \\t]*(#+[ \\t]*)?why we recommend( it)?[ \\t]*:?[ \\t]*$", "")
                .replaceAll("(?m)^[ \\t]*[*-][ \\t]+", "")
                .replaceAll("\\*\\*", "")
                .replaceAll("\n{3,}", "\n\n")
                .trim();
        return cleaned.length() > 2000 ? cleaned.substring(0, 2000).trim() : cleaned;
    }
}
