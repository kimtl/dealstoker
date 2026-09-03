package com.dealstoker.api.amazon;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AmazonProductPageFetcherTest {

    private final AmazonProductPageFetcher fetcher = new AmazonProductPageFetcher();

    @Test
    void parsesOpenGraphFields() {
        String html = """
                <html><head>
                  <meta property="og:title" content="Test Air Fryer" />
                  <meta property="og:image" content="https://m.media-amazon.com/images/I/test.jpg" />
                  <meta property="og:description" content="A great fryer" />
                  <meta property="product:price:amount" content="49.99" />
                </head><body>
                  <span id="bylineInfo">Visit the Acme Store</span>
                  <div id="feature-bullets"><ul>
                    <li><span class="a-list-item">Crispy results every time</span></li>
                    <li><span class="a-list-item">Easy clean basket</span></li>
                  </ul></div>
                </body></html>
                """;
        AmazonProductPageFetcher.ScrapedProduct scraped = fetcher.parseHtml(html);
        assertEquals("Test Air Fryer", scraped.title());
        assertEquals("https://m.media-amazon.com/images/I/test.jpg", scraped.imageUrl());
        assertTrue(scraped.description().contains("Crispy results"));
        assertNotNull(scraped.priceAmount());
        assertEquals(0, scraped.priceAmount().compareTo(new BigDecimal("49.99")));
        assertEquals("Acme", scraped.brand());
        assertEquals(2, scraped.features().size());
    }

    @Test
    void parsesMobileDetailPageShape() {
        String html = """
                <html><head>
                  <meta name="title" content="Amazon.com: Ninja Crispi Portable Air Fryer : Home &amp; Kitchen" />
                </head><body>
                  <div id="title_feature_div"><h1><span id="title">Ninja Crispi Portable Air Fryer Cooking System</span></h1></div>
                  <a id="bylineInfo">Visit the Ninja Store</a>
                  <script type="a-state">{"landingImageUrl":"https://m.media-amazon.com/images/I/71QwQhF+QhL._AC_UF350,350_QL50_.jpg"}</script>
                  <div id="corePrice_mobile_feature_div">
                    <span class="a-price"><span class="a-offscreen">$149.99</span></span>
                    <span class="a-price a-text-price"><span class="a-offscreen">$217.49</span></span>
                  </div>
                  <span class="a-icon-alt">4.6 out of 5 stars</span>
                  <span>8,200 ratings</span>
                  <div id="feature-bullets" class="a-section">
                    <ul>
                      <li><span class="a-list-item">Portable glass container for crispy results</span></li>
                      <li><span class="a-list-item">Multiple cook functions in one system</span></li>
                    </ul>
                  </div>
                  <div id="productDescription"><p>A portable air fryer for everyday cooking.</p></div>
                </body></html>
                """;

        AmazonProductPageFetcher.ScrapedProduct scraped = fetcher.parseHtml(html);
        assertEquals("Ninja Crispi Portable Air Fryer Cooking System", scraped.title());
        assertEquals("Ninja", scraped.brand());
        assertEquals(0, scraped.priceAmount().compareTo(new BigDecimal("149.99")));
        assertEquals(0, scraped.listPrice().compareTo(new BigDecimal("217.49")));
        assertEquals(0, scraped.rating().compareTo(new BigDecimal("4.6")));
        assertEquals(8200, scraped.reviewCount());
        assertEquals(2, scraped.features().size());
        assertTrue(scraped.imageUrl().contains("71QwQhF"));
        assertTrue(scraped.imageUrl().contains("_AC_SL1500_"));
        assertTrue(scraped.description().contains("Portable glass"));
        assertTrue(scraped.fetched() || scraped.title() != null);
    }

    @Test
    void rejectsTinyCaptchaPagesAsBlockedViaFetchNotePath() {
        // parseHtml itself doesn't block; looksBlocked is used by fetch().
        // Ensure tiny pages aren't considered useful PDP content.
        AmazonProductPageFetcher.ScrapedProduct scraped = fetcher.parseHtml(
                "<html><body>click the button below api-services-support@amazon.com captcha</body></html>"
        );
        assertFalse(scraped.title() != null && scraped.priceAmount() != null);
    }
}
