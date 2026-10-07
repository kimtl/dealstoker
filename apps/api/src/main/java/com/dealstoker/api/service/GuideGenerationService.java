package com.dealstoker.api.service;

import com.dealstoker.api.config.DealStokerProperties;
import com.dealstoker.api.domain.Category;
import com.dealstoker.api.util.GuideShortcodes;
import com.dealstoker.api.web.dto.ProductDtos.ProductDetail;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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
import java.util.Set;
import java.util.stream.Collectors;

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

    /**
     * House style shared by drafts and rewrites. The goal is a guide that reads like a
     * knowledgeable person wrote it: specific, decisive, honest about trade-offs. Natural voice
     * never comes from invented experience; first-hand detail only comes from editor notes.
     */
    static final String EDITOR_SYSTEM_PROMPT = """
            You are a senior editor at DealStoker, a small independent site that helps US shoppers \
            decide what to buy on Amazon.com. You write buying guides that read like a knowledgeable \
            friend talking someone through a purchase: specific, decisive where the evidence supports \
            it, honest about downsides, never salesy.

            Voice and style
            - US English, second person ("you"), contractions. Mix short and long sentences; keep \
            paragraphs to two to four sentences.
            - Open with a concrete situation or the real question a shopper has (what goes wrong \
            when people buy the wrong one), not a general statement about the category.
            - For every decision that matters, explain why it matters and give a practical rule of \
            thumb or typical range from widely accepted general knowledge. Hedge when it varies by model.
            - Be decisive: say which option suits which kind of person and why. Name trade-offs plainly, \
            including when the cheaper option is the better buy or when not buying is sensible.
            - Headings say something specific ("Basket or oven style? It depends on what you cook \
            most"), not generic labels ("Factors to consider"). Fit the structure to the topic instead \
            of forcing a template.
            - Avoid filler and stock phrases: "in today's fast-paced world", "look no further", \
            "whether you're a ... or a ...", "game-changer", "elevate", "seamless", "delve", \
            "navigate the world of", "it's important to note", "when it comes to", "in conclusion", \
            "unlock", "boasts", "must-have", "top-notch". No emojis, no exclamation marks.

            Honesty rules (strict)
            - Never say that you, DealStoker, or "our team" tested, owned, or used a product, and never \
            invent anecdotes, quotes, test results, statistics, or what reviewers say. If the editor \
            notes contain first-hand experience, use exactly that and present it as the editor's own.
            - Product facts (price, rating, review count, features) come only from the product data \
            provided. Never present a price as current; at most say "around $X when we last checked".
            - Never paste Amazon listing text verbatim. DealStoker sells nothing; purchases happen on \
            Amazon.com.

            Output exactly the envelope the user asks for, nothing else.
            """;

    /** Body brief shared by new drafts and rewrites. */
    static final String BODY_REQUIREMENTS = """
            Body requirements
            - 1,600 to 2,400 words of prose (shortcodes do not count). Start with one or two intro \
            paragraphs; no H1, the title is rendered separately.
            - Near the top, a "## The short version" section: three to five bullets that tell different \
            kinds of shoppers what to get or look for.
            - Then the decisions that actually matter, each under its own specific ## heading, with the \
            reasoning and a rule of thumb. Cover the trade-offs, the mistakes people commonly make and \
            how to avoid them, and what is not worth paying extra for.
            - A section that matches shoppers to choices by situation (household size, budget, space, \
            how often they will use it, and so on).
            - For each product you discuss: what it is good at, who it suits, and one honest limitation \
            or thing to check before buying (from the product data or general category trade-offs). \
            Put its shortcode on its own line right after that paragraph.
            - If three or more products are discussed, add a Markdown comparison table (product name, \
            best for, a key spec from the data, the catch). Use product names, never slugs, in the table.
            - End with "## FAQ": three to five questions real shoppers ask, each as a ### heading with a \
            direct two-to-four sentence answer. Then one short closing paragraph with a practical next \
            step (not a summary, not "in conclusion").
            - No year in headings unless the topic has one.
            """;

    private final DealStokerProperties properties;
    private final RestClient restClient;
    private final String guideModel;

    public GuideGenerationService(
            DealStokerProperties properties,
            @Value("${dealstoker.ai.guide-model:}") String guideModel
    ) {
        this.properties = properties;
        this.restClient = AiRestClients.create();
        this.guideModel = guideModel == null || guideModel.isBlank() ? null : guideModel.trim();
    }

    public boolean isConfigured() {
        return properties.ai() != null && properties.ai().isConfigured();
    }

    public Draft draft(Category category, String topic, List<ProductDetail> products, String editorNotes) {
        requireConfigured();
        if ((topic == null || topic.isBlank()) && category == null) {
            throw new IllegalArgumentException("Give the draft a topic or pick a category");
        }
        String raw = chat(EDITOR_SYSTEM_PROMPT, buildDraftPrompt(category, topic, products, editorNotes), 0.75);
        return toDraft(raw, products, firstNonBlank(
                topic, category != null ? category.getName() + " buying guide" : "Buying guide"));
    }

    /**
     * Rewrites an existing guide into a fuller, more natural one. Keeps the topic and every
     * product shortcode; products are passed in so the model has their real data.
     */
    public Draft rewrite(
            String title,
            String excerpt,
            String body,
            Category category,
            List<ProductDetail> products,
            String editorNotes
    ) {
        requireConfigured();
        if (body == null || body.isBlank()) {
            throw new IllegalArgumentException("Nothing to rewrite: the English body is empty");
        }
        String raw = chat(EDITOR_SYSTEM_PROMPT, buildRewritePrompt(title, excerpt, body, category, products, editorNotes), 0.7);
        return toDraft(raw, products, firstNonBlank(title, "Buying guide"));
    }

    public Translation translateToKorean(String title, String excerpt, String body) {
        requireConfigured();
        if (body == null || body.isBlank()) {
            throw new IllegalArgumentException("Nothing to translate: the English body is empty");
        }
        StringBuilder user = new StringBuilder();
        user.append("Localize this DealStoker buying guide for Korean readers who shop on Amazon.com (US).\n");
        user.append("It should read as if a Korean editor wrote it in Korean, not as a translation.\n");
        user.append("Rules:\n");
        user.append("- Natural Korean magazine prose in consistent polite 합니다체. Rephrase freely for flow; ");
        user.append("keep the meaning, every fact, every number, and the same sections.\n");
        user.append("- Avoid 번역투: no 당신, no stacked passives, don't repeat \"~하는 것이 중요합니다\", ");
        user.append("and turn English idioms into natural Korean expressions.\n");
        user.append("- Keep all Markdown structure (headings, lists, tables), links and URLs exactly as they are.\n");
        user.append("- Keep every {{product:...}} shortcode exactly as written, on its own line.\n");
        user.append("- Keep brand names, model names and ASINs in the original Latin script.\n");
        user.append("- Prices stay in USD. For US units (quarts, inches, pounds, °F) keep the original and add ");
        user.append("a metric equivalent in parentheses the first time it appears, e.g. 6쿼트(약 5.7L).\n");
        user.append("- Use 할인 for discounts (not 가격 하락).\n\n");
        user.append("Respond in exactly this envelope:\nTITLE: <Korean title>\nEXCERPT: <Korean excerpt, one or two sentences>\nBODY:\n<Korean Markdown body>\n\n");
        user.append("=== ENGLISH TITLE ===\n").append(title == null ? "" : title.trim()).append('\n');
        user.append("=== ENGLISH EXCERPT ===\n").append(excerpt == null ? "" : excerpt.trim()).append('\n');
        user.append("=== ENGLISH BODY ===\n").append(body.trim()).append('\n');

        String raw = chat(
                "You are a Korean editor who localizes English shopping guides for Korean readers. "
                        + "Output exactly the envelope the user requests, nothing else.",
                user.toString(),
                0.3
        );
        Map<String, String> parts = parseEnvelope(raw, "TITLE", "EXCERPT", "BODY");
        String bodyKo = parts.getOrDefault("BODY", "").trim();
        if (bodyKo.isBlank()) {
            throw new IllegalArgumentException("AI returned no Korean body");
        }
        // Never let a translation add, drop or rename product cards.
        bodyKo = GuideShortcodes.keepOnly(stripLeadingH1(bodyKo), Set.copyOf(GuideShortcodes.productSlugs(body)));
        return new Translation(blankToNull(parts.get("TITLE")), blankToNull(parts.get("EXCERPT")), bodyKo);
    }

    // ---------- prompt building ----------

    private String buildDraftPrompt(Category category, String topic, List<ProductDetail> products, String editorNotes) {
        StringBuilder sb = new StringBuilder();
        sb.append("Write a new buying guide");
        if (topic != null && !topic.isBlank()) {
            sb.append(" on the topic: \"").append(topic.trim()).append('"');
        }
        appendCategory(sb, category);
        sb.append(".\n\n");
        appendEnvelope(sb);
        sb.append(BODY_REQUIREMENTS);
        appendProducts(sb, products);
        appendEditorNotes(sb, editorNotes);
        return sb.toString();
    }

    private String buildRewritePrompt(
            String title,
            String excerpt,
            String body,
            Category category,
            List<ProductDetail> products,
            String editorNotes
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("Rewrite and expand the existing DealStoker guide below");
        appendCategory(sb, category);
        sb.append(". Readers say the current version is too short and reads like a template. Keep its ");
        sb.append("topic and any claims that are supported by the product data or general knowledge, drop ");
        sb.append("filler, and restructure freely so it meets the requirements. You may improve the title ");
        sb.append("and excerpt.\n\n");
        appendEnvelope(sb);
        sb.append(BODY_REQUIREMENTS);
        sb.append("- Keep every product shortcode from the current guide (each exactly once) and do not add ");
        sb.append("products that are not listed below.\n");
        appendProducts(sb, products);
        appendEditorNotes(sb, editorNotes);
        sb.append("\n=== CURRENT TITLE ===\n").append(title == null ? "" : title.trim()).append('\n');
        sb.append("=== CURRENT EXCERPT ===\n").append(excerpt == null ? "" : excerpt.trim()).append('\n');
        sb.append("=== CURRENT BODY ===\n").append(body.trim()).append('\n');
        return sb.toString();
    }

    private static void appendCategory(StringBuilder sb, Category category) {
        if (category == null) {
            return;
        }
        sb.append(" for the DealStoker category \"").append(category.getName().trim()).append('"');
        if (category.getDescription() != null && !category.getDescription().isBlank()) {
            sb.append(" (").append(category.getDescription().trim()).append(')');
        }
    }

    private static void appendEnvelope(StringBuilder sb) {
        sb.append("Respond in exactly this envelope and nothing else:\n");
        sb.append("TITLE: <specific, natural title, max 70 characters, no clickbait, no year unless the topic has one>\n");
        sb.append("EXCERPT: <one or two plain sentences, max 160 characters, what the reader will be able to decide>\n");
        sb.append("BODY:\n<Markdown body>\n\n");
    }

    private static void appendProducts(StringBuilder sb, List<ProductDetail> products) {
        if (products == null || products.isEmpty()) {
            sb.append("- There are no catalog products for this guide: write no product shortcodes and no ");
            sb.append("comparison table of specific products.\n");
            return;
        }
        sb.append("- Embed a product card by putting its shortcode on its own line, exactly like: ");
        sb.append("{{product:SLUG}}. Use only the slugs listed, each at most once.\n\n");
        sb.append("Product data (the only source for product facts):\n");
        for (ProductDetail product : products.stream().limit(MAX_PRODUCTS).toList()) {
            sb.append("- slug: ").append(product.slug()).append('\n');
            sb.append("  name: ").append(product.title()).append('\n');
            if (product.brand() != null) sb.append("  brand: ").append(product.brand()).append('\n');
            if (product.categoryName() != null) sb.append("  category: ").append(product.categoryName()).append('\n');
            if (product.priceAmount() != null) {
                String currency = product.currency() == null ? "USD" : product.currency();
                sb.append("  price when last checked: ").append(currency).append(' ').append(product.priceAmount());
                if (product.listPrice() != null && product.listPrice().compareTo(product.priceAmount()) > 0) {
                    sb.append(" (list price ").append(product.listPrice()).append(')');
                }
                sb.append('\n');
            }
            if (product.rating() != null) sb.append("  rating: ").append(product.rating()).append(" / 5\n");
            if (product.reviewCount() != null) sb.append("  reviews: ").append(product.reviewCount()).append('\n');
            if (product.features() != null && !product.features().isEmpty()) {
                sb.append("  features:\n");
                for (String feature : product.features().stream().limit(8).toList()) {
                    sb.append("    - ").append(clip(feature, 300)).append('\n');
                }
            }
            if (product.description() != null && !product.description().isBlank()) {
                sb.append("  description (paraphrase, never copy): ").append(clip(product.description(), 700)).append('\n');
            }
            if (product.recommendation() != null && !product.recommendation().isBlank()) {
                sb.append("  DealStoker note: ").append(clip(product.recommendation(), 500)).append('\n');
            }
        }
    }

    private static void appendEditorNotes(StringBuilder sb, String editorNotes) {
        if (editorNotes == null || editorNotes.isBlank()) {
            return;
        }
        sb.append("\nEditor notes (follow closely; this is the only source of first-hand experience):\n");
        sb.append(editorNotes.trim()).append('\n');
    }

    private Draft toDraft(String raw, List<ProductDetail> products, String fallbackTitle) {
        Map<String, String> parts = parseEnvelope(raw, "TITLE", "EXCERPT", "BODY");
        String body = parts.getOrDefault("BODY", "").trim();
        if (body.isBlank()) {
            throw new IllegalArgumentException("AI returned no guide body");
        }
        Set<String> allowed = products == null ? Set.of()
                : products.stream().map(ProductDetail::slug).collect(Collectors.toSet());
        body = GuideShortcodes.keepOnly(stripLeadingH1(body), allowed);
        return new Draft(firstNonBlank(parts.get("TITLE"), fallbackTitle), blankToNull(parts.get("EXCERPT")), body);
    }

    /** The page renders the title itself; drop a leading "# Title" line if the model adds one. */
    static String stripLeadingH1(String body) {
        String trimmed = body.stripLeading();
        if (trimmed.startsWith("# ")) {
            int newline = trimmed.indexOf('\n');
            return newline < 0 ? "" : trimmed.substring(newline + 1).trim();
        }
        return body.trim();
    }

    private static String clip(String value, int max) {
        String flat = value.replaceAll("\\s+", " ").trim();
        return flat.length() <= max ? flat : flat.substring(0, max).trim() + "…";
    }

    // ---------- OpenAI call + parsing ----------

    private String chat(String system, String user, double temperature) {
        DealStokerProperties.Ai ai = properties.ai();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", guideModel != null ? guideModel : ai.resolvedModel());
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
        return text.length() > 60000 ? text.substring(0, 60000) : text;
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
