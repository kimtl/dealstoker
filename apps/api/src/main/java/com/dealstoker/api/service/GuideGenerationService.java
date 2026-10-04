package com.dealstoker.api.service;

import com.dealstoker.api.config.DealStokerProperties;
import com.dealstoker.api.domain.Category;
import com.dealstoker.api.web.dto.ProductDtos.ProductDetail;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * AI drafts for editorial guides: a Markdown first draft that references catalog
 * products through {@code {{product:slug}}} shortcodes, and a Korean translation.
 * Output uses a fixed TITLE / EXCERPT / BODY envelope so parsing is deterministic.
 */
@Service
public class GuideGenerationService {

    private static final Logger log = LoggerFactory.getLogger(GuideGenerationService.class);
    private static final JsonMapper MAPPER = JsonMapper.builder().build();
    private static final int MAX_PRODUCTS = 8;

    public record Draft(String title, String excerpt, String body) {}

    public record Translation(String titleKo, String excerptKo, String bodyKo) {}

    private final DealStokerProperties properties;
    private final RestClient restClient;

    public GuideGenerationService(DealStokerProperties properties) {
        this.properties = properties;
        this.restClient = AiRestClients.create();
    }

    public boolean isConfigured() {
        return properties.ai() != null && properties.ai().isConfigured();
    }

    public Draft draft(Category category, String topic, List<ProductDetail> products, String editorPrompt) {
        requireConfigured();
        if ((topic == null || topic.isBlank()) && category == null) {
            throw new IllegalArgumentException("Give the draft a topic or pick a category");
        }
        String raw = chat(
                "You write original, practical Amazon.com buying guides for DealStoker, a US deal "
                        + "curation site. US English, plain Markdown (## headings, lists, tables). "
                        + "Never fabricate specs, statistics or testimonials. Never paste Amazon listing "
                        + "text verbatim. Output exactly the envelope the user requests.",
                buildDraftPrompt(category, topic, products, editorPrompt),
                0.6
        );
        Map<String, String> parts = parseEnvelope(raw, "TITLE", "EXCERPT", "BODY");
        String body = parts.getOrDefault("BODY", "").trim();
        if (body.isBlank()) {
            throw new IllegalArgumentException("AI returned no guide body");
        }
        return new Draft(
                firstNonBlank(parts.get("TITLE"), topic, category != null ? category.getName() + " buying guide" : "Buying guide"),
                blankToNull(parts.get("EXCERPT")),
                body
        );
    }

    public Translation translateToKorean(String title, String excerpt, String body) {
        requireConfigured();
        if (body == null || body.isBlank()) {
            throw new IllegalArgumentException("Nothing to translate: the English body is empty");
        }
        StringBuilder user = new StringBuilder();
        user.append("Translate this DealStoker buying guide into natural Korean for Korean shoppers buying on Amazon.com.\n");
        user.append("Rules:\n");
        user.append("- Keep all Markdown structure, links and URLs exactly as they are.\n");
        user.append("- Keep every {{product:...}} shortcode exactly as written, on its own line.\n");
        user.append("- Keep brand names, model names and ASINs in the original Latin script.\n");
        user.append("- Prices stay in USD. Do not add or remove sections.\n");
        user.append("- Use 할인 for discounts (not 가격 하락).\n\n");
        user.append("Respond in exactly this envelope:\nTITLE: <Korean title>\nEXCERPT: <Korean excerpt, one or two sentences>\nBODY:\n<Korean Markdown body>\n\n");
        user.append("=== ENGLISH TITLE ===\n").append(title == null ? "" : title.trim()).append('\n');
        user.append("=== ENGLISH EXCERPT ===\n").append(excerpt == null ? "" : excerpt.trim()).append('\n');
        user.append("=== ENGLISH BODY ===\n").append(body.trim()).append('\n');

        String raw = chat(
                "You are a professional English→Korean translator for e-commerce editorial content. "
                        + "Output exactly the envelope the user requests, nothing else.",
                user.toString(),
                0.2
        );
        Map<String, String> parts = parseEnvelope(raw, "TITLE", "EXCERPT", "BODY");
        String bodyKo = parts.getOrDefault("BODY", "").trim();
        if (bodyKo.isBlank()) {
            throw new IllegalArgumentException("AI returned no Korean body");
        }
        return new Translation(blankToNull(parts.get("TITLE")), blankToNull(parts.get("EXCERPT")), bodyKo);
    }

    // ---------- prompt building ----------

    private String buildDraftPrompt(Category category, String topic, List<ProductDetail> products, String editorPrompt) {
        StringBuilder sb = new StringBuilder();
        sb.append("Write a buying guide");
        if (topic != null && !topic.isBlank()) {
            sb.append(" on the topic: \"").append(topic.trim()).append('"');
        }
        if (category != null) {
            sb.append(" for the DealStoker category \"").append(category.getName().trim()).append('"');
            if (category.getDescription() != null && !category.getDescription().isBlank()) {
                sb.append(" (").append(category.getDescription().trim()).append(')');
            }
        }
        sb.append(".\n\n");
        sb.append("Respond in exactly this envelope and nothing else:\n");
        sb.append("TITLE: <SEO-friendly title, max 70 characters, no year unless the topic has one>\n");
        sb.append("EXCERPT: <one or two sentences, max 160 characters, what the reader will learn>\n");
        sb.append("BODY:\n<Markdown body>\n\n");
        sb.append("Body requirements:\n");
        sb.append("- 700-1200 words. Start with a short intro paragraph (no H1; the title is rendered separately).\n");
        sb.append("- Use ## headings for sections: what to check before buying (3-6 concrete checkpoints), ");
        sb.append("common mistakes, who should buy what, and a closing \"How to use these deals\" note.\n");
        sb.append("- Prefer specifics (capacities, wattage, materials, warranty terms) over marketing adjectives.\n");
        sb.append("- Do not claim DealStoker sells anything; purchases happen on Amazon.com.\n");
        sb.append("- Do not invent prices, review counts or star ratings; only use the product data below.\n");
        if (products != null && !products.isEmpty()) {
            sb.append("- Reference the products below where they fit naturally. To embed a product card, put the ");
            sb.append("shortcode on its own line right after the paragraph that discusses it, exactly like: {{product:SLUG}}\n");
            sb.append("- Use each product at most once and only the slugs listed.\n\n");
            sb.append("Available products:\n");
            for (ProductDetail product : products.stream().limit(MAX_PRODUCTS).toList()) {
                sb.append("- slug: ").append(product.slug()).append('\n');
                sb.append("  title: ").append(product.title()).append('\n');
                if (product.brand() != null) sb.append("  brand: ").append(product.brand()).append('\n');
                if (product.priceAmount() != null) {
                    sb.append("  shown price: ").append(product.currency() == null ? "USD" : product.currency())
                            .append(' ').append(product.priceAmount()).append('\n');
                }
                if (product.rating() != null) sb.append("  rating: ").append(product.rating()).append(" / 5\n");
                if (product.reviewCount() != null) sb.append("  reviews: ").append(product.reviewCount()).append('\n');
                if (product.features() != null && !product.features().isEmpty()) {
                    sb.append("  features:\n");
                    for (String feature : product.features().stream().limit(5).toList()) {
                        sb.append("    - ").append(feature).append('\n');
                    }
                }
            }
        } else {
            sb.append("- No product shortcodes: there are no products to reference.\n");
        }
        if (editorPrompt != null && !editorPrompt.isBlank()) {
            sb.append("\nEditor instructions (follow closely):\n").append(editorPrompt.trim()).append('\n');
        }
        return sb.toString();
    }

    // ---------- OpenAI call + parsing ----------

    private String chat(String system, String user, double temperature) {
        DealStokerProperties.Ai ai = properties.ai();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", ai.resolvedModel());
        body.put("temperature", temperature);
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", system));
        messages.add(Map.of("role", "user", "content", user));
        body.put("messages", messages);
        try {
            String raw = restClient.post()
                    .uri(ai.resolvedBaseUrl() + "/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + ai.apiKey().trim())
                    .body(body)
                    .retrieve()
                    .body(String.class);
            return extractContent(raw);
        } catch (RestClientResponseException ex) {
            log.warn("OpenAI guide request failed status={}: {}", ex.getStatusCode().value(), ex.getResponseBodyAsString());
            throw new IllegalArgumentException(
                    "AI request failed (" + ex.getStatusCode().value() + "). Check OPENAI_API_KEY / model.");
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("OpenAI guide request failed: {}", ex.toString());
            throw new IllegalArgumentException("AI request failed: " + ex.getMessage());
        }
    }

    private static String extractContent(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("AI returned an empty response");
        }
        JsonNode root = MAPPER.readTree(raw);
        JsonNode content = root.path("choices").path(0).path("message").path("content");
        if (content.isMissingNode() || content.asString("").isBlank()) {
            throw new IllegalArgumentException("AI returned no text");
        }
        String text = content.asString().trim();
        return text.length() > 30000 ? text.substring(0, 30000) : text;
    }

    /** Parses "KEY: value" lines; the last key (BODY) swallows everything after it. */
    static Map<String, String> parseEnvelope(String raw, String... keys) {
        Map<String, String> out = new LinkedHashMap<>();
        if (raw == null) {
            return out;
        }
        String text = raw.replace("\r\n", "\n").trim();
        // Strip a stray ```markdown fence around the whole answer.
        if (text.startsWith("```")) {
            int firstNewline = text.indexOf('\n');
            text = firstNewline > 0 ? text.substring(firstNewline + 1) : text;
            if (text.endsWith("```")) {
                text = text.substring(0, text.length() - 3);
            }
        }
        String lastKey = keys[keys.length - 1];
        int bodyIdx = indexOfKey(text, lastKey);
        String head = bodyIdx >= 0 ? text.substring(0, bodyIdx) : text;
        if (bodyIdx >= 0) {
            out.put(lastKey, text.substring(bodyIdx + lastKey.length() + 1).trim());
        }
        for (String line : head.split("\n")) {
            for (String key : keys) {
                if (key.equals(lastKey)) continue;
                String prefix = key + ":";
                if (line.regionMatches(true, 0, prefix, 0, prefix.length())) {
                    out.put(key, line.substring(prefix.length()).trim().replaceAll("^[\"“]|[\"”]$", ""));
                }
            }
        }
        if (!out.containsKey(lastKey)) {
            out.put(lastKey, text);
        }
        return out;
    }

    private static int indexOfKey(String text, String key) {
        String upper = text.toUpperCase();
        int idx = upper.indexOf(key + ":");
        while (idx > 0 && upper.charAt(idx - 1) != '\n') {
            idx = upper.indexOf(key + ":", idx + 1);
        }
        return idx;
    }

    private void requireConfigured() {
        if (!isConfigured()) {
            throw new IllegalArgumentException("AI is not configured. Set OPENAI_API_KEY on the API service.");
        }
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) return value.trim();
        }
        return null;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
