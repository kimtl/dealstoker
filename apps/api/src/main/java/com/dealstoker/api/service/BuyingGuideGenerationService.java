package com.dealstoker.api.service;

import com.dealstoker.api.config.DealStokerProperties;
import com.dealstoker.api.domain.Category;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
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
public class BuyingGuideGenerationService {

    private static final Logger log = LoggerFactory.getLogger(BuyingGuideGenerationService.class);
    private static final JsonMapper MAPPER = JsonMapper.builder().build();

    private final DealStokerProperties properties;
    private final RestClient restClient;

    public BuyingGuideGenerationService(DealStokerProperties properties) {
        this.properties = properties;
        this.restClient = AiRestClients.create();
    }

    public boolean isConfigured() {
        return properties.ai() != null && properties.ai().isConfigured();
    }

    public String generate(Category category, String editorPrompt) {
        if (!isConfigured()) {
            throw new IllegalArgumentException(
                    "AI is not configured. Set OPENAI_API_KEY on the API service."
            );
        }
        if (category.getName() == null || category.getName().isBlank()) {
            throw new IllegalArgumentException("Category name is required to generate a buying guide");
        }
        return callChatCompletions(buildUserPrompt(category, editorPrompt));
    }

    private String buildUserPrompt(Category category, String editorPrompt) {
        StringBuilder sb = new StringBuilder();
        sb.append("Write a practical Amazon.com buying guide for the category \"")
                .append(category.getName().trim())
                .append("\" on DealStoker (US shoppers).\n\n");
        sb.append("Goals:\n");
        sb.append("- Help shoppers decide what to look for before buying in this category.\n");
        sb.append("- Be specific and useful; avoid generic marketing fluff.\n");
        sb.append("- Do not invent fake statistics, brand rankings, or testimonials.\n");
        sb.append("- Do not claim DealStoker sells products; purchases happen on Amazon.com.\n");
        sb.append("- US English. Plain text only (no markdown headings). Keep under 2200 characters.\n\n");
        sb.append("Suggested structure:\n");
        sb.append("1) Short intro (what this category is for)\n");
        sb.append("2) What to check before you buy (3-6 concrete checkpoints)\n");
        sb.append("3) Common mistakes / what to skip\n");
        sb.append("4) How to use DealStoker deals in this category (price, ratings, review volume)\n\n");

        if (category.getDescription() != null && !category.getDescription().isBlank()) {
            sb.append("Category description: ").append(category.getDescription().trim()).append("\n\n");
        }
        if (category.getSlug() != null) {
            sb.append("Category slug: ").append(category.getSlug()).append("\n\n");
        }
        if (editorPrompt != null && !editorPrompt.isBlank()) {
            sb.append("Editor instructions (follow closely):\n")
                    .append(editorPrompt.trim())
                    .append("\n");
        }
        return sb.toString();
    }

    private String callChatCompletions(String userPrompt) {
        DealStokerProperties.Ai ai = properties.ai();
        String url = ai.resolvedBaseUrl() + "/chat/completions";

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", ai.resolvedModel());
        body.put("temperature", 0.55);
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of(
                "role", "system",
                "content",
                "You write concise, original category buying guides for DealStoker, "
                        + "a US Amazon deal curation site. Output plain text only."
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
            log.warn("OpenAI buying guide failed status={}: {}", ex.getStatusCode().value(), ex.getResponseBodyAsString());
            throw new IllegalArgumentException(
                    "AI request failed (" + ex.getStatusCode().value() + "). Check OPENAI_API_KEY / model."
            );
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("OpenAI buying guide failed: {}", ex.toString());
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
            throw new IllegalArgumentException("AI returned no buying guide text");
        }
        String text = content.asString().trim();
        if (text.length() > 8000) {
            text = text.substring(0, 8000);
        }
        return text;
    }
}
