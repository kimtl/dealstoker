package com.dealstoker.api.service;

import com.dealstoker.api.config.DealStokerProperties;
import com.dealstoker.api.web.dto.ProductDtos.ProductDetail;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class GuideGenerationServiceTest {

    @Test
    void parsesTitleExcerptBodyEnvelope() {
        String raw = """
                TITLE: How to Choose an Air Fryer
                EXCERPT: "Capacity, wattage and the features worth paying for."
                BODY:
                Intro paragraph.

                ## Start with capacity
                {{product:cosori-12-in-1-air-fryer-oven}}
                """;
        Map<String, String> parts = GuideGenerationService.parseEnvelope(raw, "TITLE", "EXCERPT", "BODY");
        assertEquals("How to Choose an Air Fryer", parts.get("TITLE"));
        assertEquals("Capacity, wattage and the features worth paying for.", parts.get("EXCERPT"));
        assertEquals("Intro paragraph.\n\n## Start with capacity\n{{product:cosori-12-in-1-air-fryer-oven}}",
                parts.get("BODY"));
    }

    @Test
    void stripsCodeFenceAndFallsBackToWholeTextAsBody() {
        String raw = "```markdown\n## Just a body\nNo envelope here.\n```";
        Map<String, String> parts = GuideGenerationService.parseEnvelope(raw, "TITLE", "EXCERPT", "BODY");
        assertNull(parts.get("TITLE"));
        assertEquals("## Just a body\nNo envelope here.", parts.get("BODY").trim());
    }

    @Test
    void bodyKeyInsideTextDoesNotSplitEarly() {
        String raw = "TITLE: T\nEXCERPT: The BODY: of the matter\nBODY:\nreal body";
        Map<String, String> parts = GuideGenerationService.parseEnvelope(raw, "TITLE", "EXCERPT", "BODY");
        assertEquals("The BODY: of the matter", parts.get("EXCERPT"));
        assertEquals("real body", parts.get("BODY"));
    }

    @Test
    void stripsLeadingH1() {
        assertEquals("Intro.", GuideGenerationService.stripLeadingH1("# Title\n\nIntro."));
        assertEquals("Intro.\n\n## Section", GuideGenerationService.stripLeadingH1("Intro.\n\n## Section"));
    }

    @Test
    void rewriteSendsBriefAndProductDataAndCleansTheResult() throws Exception {
        JsonMapper mapper = JsonMapper.builder().build();
        AtomicReference<JsonNode> sent = new AtomicReference<>();
        String answer = """
                TITLE: Air fryers: what size and style to buy
                EXCERPT: Pick the right capacity and style for how you cook.
                BODY:
                # Air fryers: what size and style to buy

                You open the box and the basket fits two chicken thighs.

                {{product:cosori-oven}}

                {{product:invented-slug}}

                ## FAQ
                """;
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v1/chat/completions", exchange -> {
            sent.set(mapper.readTree(exchange.getRequestBody().readAllBytes()));
            byte[] out = mapper.writeValueAsBytes(Map.of(
                    "choices", List.of(Map.of("message", Map.of("content", answer)))));
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, out.length);
            exchange.getResponseBody().write(out);
            exchange.close();
        });
        server.start();
        try {
            DealStokerProperties properties = new DealStokerProperties(
                    "http://localhost", null, null, null,
                    new DealStokerProperties.Ai("test-key",
                            "http://127.0.0.1:" + server.getAddress().getPort() + "/v1", "small-model"));
            GuideGenerationService service = new GuideGenerationService(properties, "long-form-model");

            GuideGenerationService.Draft draft = service.rewrite(
                    "Air fryer guide",
                    "Short excerpt.",
                    "Old intro.\n\n{{product:cosori-oven}}",
                    null,
                    List.of(product("cosori-oven", "COSORI 12-in-1 Air Fryer Oven")),
                    "I cook for two and hate cleaning baskets.");

            assertThat(draft.title()).isEqualTo("Air fryers: what size and style to buy");
            assertThat(draft.body())
                    .startsWith("You open the box")
                    .contains("{{product:cosori-oven}}")
                    .doesNotContain("invented-slug")
                    .doesNotContain("# Air fryers");

            JsonNode request = sent.get();
            assertThat(request.path("model").asString()).isEqualTo("long-form-model");
            String system = request.path("messages").path(0).path("content").asString();
            String user = request.path("messages").path(1).path("content").asString();
            assertThat(system).contains("Never say that you, DealStoker").doesNotContain("\\");
            assertThat(user)
                    .contains("1,600 to 2,400 words")
                    .contains("slug: cosori-oven")
                    .contains("price when last checked: USD 119.99 (list price 173.99)")
                    .contains("I cook for two and hate cleaning baskets.")
                    .contains("=== CURRENT BODY ===\nOld intro.");
        } finally {
            server.stop(0);
        }
    }

    private static ProductDetail product(String slug, String title) {
        return new ProductDetail(
                1L, "AMAZON", "B000TEST", "www.amazon.com", title, slug,
                "A countertop oven-style air fryer.", null, null,
                new BigDecimal("119.99"), "USD", new BigDecimal("173.99"), null,
                new BigDecimal("4.6"), 21000, null, "COSORI", List.of("12 cooking functions", "26-quart capacity"),
                null, null, null, null, "home-kitchen", "Home & Kitchen",
                null, null, null, false, 0);
    }
}
