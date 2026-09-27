package com.dealstoker.api.affiliate;

import com.dealstoker.api.config.DealStokerProperties;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AffiliateLinkBuilderTest {

    @Test
    void appendsTagWhenMissing() {
        AffiliateLinkBuilder builder = new AffiliateLinkBuilder(props("dealstoker-20"));
        String url = builder.buildOutboundUrl("https://www.amazon.com/dp/B000123ABC");
        assertTrue(url.contains("tag=dealstoker-20"));
        assertTrue(url.contains("/dp/B000123ABC"));
    }

    @Test
    void usesDefaultTagWhenConfigBlank() {
        AffiliateLinkBuilder builder = new AffiliateLinkBuilder(props(""));
        String url = builder.buildOutboundUrl("https://www.amazon.com/dp/B000123ABC");
        assertTrue(url.contains("tag=" + AffiliateLinkBuilder.DEFAULT_PARTNER_TAG));
    }

    @Test
    void canonicalizesBrokenLinkAmazonHostUsingAsinHint() {
        AffiliateLinkBuilder builder = new AffiliateLinkBuilder(props("dealstoker01-20"));
        String url = builder.buildOutboundUrl("https://link.amazon/B0i32xtuu", "B0DNW25S87");
        assertEquals(
                "https://www.amazon.com/dp/B0DNW25S87?tag=dealstoker01-20",
                url
        );
    }

    @Test
    void replacesExistingTagOnAmazonUrl() {
        AffiliateLinkBuilder builder = new AffiliateLinkBuilder(props("dealstoker01-20"));
        String url = builder.buildOutboundUrl(
                "https://www.amazon.com/dp/B000123ABC?tag=someone-else&psc=1"
        );
        assertTrue(url.contains("tag=dealstoker01-20"));
        assertTrue(!url.contains("someone-else"));
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
                new DealStokerProperties.Cors("http://localhost:3000"),
                new DealStokerProperties.Ai("", "https://api.openai.com/v1", "gpt-4o-mini")
        );
    }
}
