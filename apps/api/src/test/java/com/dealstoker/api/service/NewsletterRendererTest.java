package com.dealstoker.api.service;

import com.dealstoker.api.service.NewsletterRenderer.Context;
import com.dealstoker.api.service.NewsletterRenderer.GuideItem;
import com.dealstoker.api.service.NewsletterRenderer.IssueContent;
import com.dealstoker.api.service.NewsletterRenderer.ProductItem;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class NewsletterRendererTest {

    private final IssueContent content = new IssueContent(
            List.of(new GuideItem("air-fryers", "How to choose an air fryer", "에어프라이어 고르는 법",
                    "Size first.", "크기부터.", null)),
            List.of(new ProductItem("cosori", "COSORI <Air> Fryer", "https://m.media-amazon.com/x.jpg",
                    new BigDecimal("119.99"), new BigDecimal("173.99"), "USD", new BigDecimal("4.6"), 21000,
                    Instant.parse("2026-10-07T02:10:00Z"))),
            List.of());

    private Context ctx(String locale) {
        return new Context(7, locale, "This week", "Hello there", "https://www.dealstoker.com",
                "https://www.dealstoker.com/newsletter/unsubscribe?token=abc", "PO Box 1, Atlanta, GA 30301");
    }

    @Test
    void englishIssueHasLinksPricesAndRequiredFooter() {
        NewsletterRenderer.Rendered r = NewsletterRenderer.render(content, ctx("en"));

        assertThat(r.html())
                .contains("https://www.dealstoker.com/guides/air-fryers?utm_source=newsletter&amp;utm_medium=email&amp;utm_campaign=issue-7")
                .contains("https://www.dealstoker.com/p/cosori?utm_source=newsletter")
                .contains("COSORI &lt;Air&gt; Fryer")
                .contains("$119.99").contains("-31%")
                .contains("Price as of Oct 6, 2026, 10:10 PM EDT")
                .contains("newsletter/unsubscribe?token=abc")
                .contains("PO Box 1, Atlanta, GA 30301")
                .contains("As an Amazon Associate")
                .doesNotContain("amazon.com/dp")
                .doesNotContain("tag=");
        assertThat(r.text()).contains("Unsubscribe: https://www.dealstoker.com/newsletter/unsubscribe?token=abc");
    }

    @Test
    void koreanIssueUsesKoreanTitlesAndHlLinks() {
        NewsletterRenderer.Rendered r = NewsletterRenderer.render(content, ctx("ko"));

        assertThat(r.html())
                .contains("에어프라이어 고르는 법")
                .contains("새 구매 가이드")
                .contains("구독 해지")
                .contains("&amp;hl=ko")
                .contains("US$119.99");
    }
}
