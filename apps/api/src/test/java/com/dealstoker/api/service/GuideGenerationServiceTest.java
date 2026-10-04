package com.dealstoker.api.service;

import org.junit.jupiter.api.Test;

import java.util.Map;

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
}
