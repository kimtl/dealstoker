package com.dealstoker.api.affiliate;

import com.dealstoker.api.config.DealStokerProperties;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AffiliateLinkBuilderTest {

    @Test
    void appendsTagWhenMissing() {
        AffiliateLinkBuilder builder = new AffiliateLinkBuilder(props("dealstoker-20"));
        String url = builder.buildOutboundUrl("https://www.amazon.com/dp/B000123");
        assertTrue(url.contains("tag=dealstoker-20"));
    }

    @Test
    void leavesUrlWhenTagAbsent() {
        AffiliateLinkBuilder builder = new AffiliateLinkBuilder(props(""));
        String url = builder.buildOutboundUrl("https://www.amazon.com/dp/B000123");
        assertEquals("https://www.amazon.com/dp/B000123", url);
    }

    @Test
    void leavesShortAffiliateLinksUntouched() {
        AffiliateLinkBuilder builder = new AffiliateLinkBuilder(props("dealstoker01-20"));
        String shortLink = "https://amzn.to/abc123";
        assertEquals(shortLink, builder.buildOutboundUrl(shortLink));
    }

    private DealStokerProperties props(String tag) {
        return new DealStokerProperties(
                "https://dealstoker.com",
                new DealStokerProperties.Amazon("www.amazon.com", tag),
                new DealStokerProperties.Admin("admin", "pass"),
                new DealStokerProperties.Cors("http://localhost:3000")
        );
    }
}
