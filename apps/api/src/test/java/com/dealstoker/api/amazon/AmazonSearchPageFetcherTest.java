package com.dealstoker.api.amazon;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AmazonSearchPageFetcherTest {

    private final AmazonSearchPageFetcher fetcher = new AmazonSearchPageFetcher();

    @Test
    void parsesSearchResultCardsAndSkipsEmptyAsin() {
        String html = """
                <html><body>
                  <div data-component-type="s-search-result" data-asin="">
                    <h2><a href="/x"><span>Ignore empty</span></a></h2>
                  </div>
                  <div data-component-type="s-search-result" data-asin="B0TESTASIN">
                    <h2><a href="/Some-Product/dp/B0TESTASIN"><span>Ninja Air Fryer Pro</span></a></h2>
                    <img class="s-image" src="https://m.media-amazon.com/images/I/test.jpg" />
                    <span class="a-price"><span class="a-offscreen">$79.99</span></span>
                    <span class="a-price a-text-price"><span class="a-offscreen">$129.99</span></span>
                    <span class="a-icon-alt">4.6 out of 5 stars</span>
                    <span aria-label="12,345 ratings">12,345</span>
                  </div>
                  <div data-component-type="s-search-result" data-asin="B0SPONSOR1">
                    <span class="s-sponsored-label-text">Sponsored</span>
                    <h2><a href="/dp/B0SPONSOR1"><span>Sponsored Widget</span></a></h2>
                    <span class="a-price"><span class="a-offscreen">$19.99</span></span>
                  </div>
                </body></html>
                """;

        List<AmazonSearchPageFetcher.SearchHit> hits = fetcher.parseHtml(html, "air fryer", 20);
        assertEquals(2, hits.size());

        AmazonSearchPageFetcher.SearchHit first = hits.getFirst();
        assertEquals("B0TESTASIN", first.asin());
        assertTrue(first.title().contains("Ninja Air Fryer"));
        assertEquals(0, first.priceAmount().compareTo(new BigDecimal("79.99")));
        assertEquals(0, first.listPrice().compareTo(new BigDecimal("129.99")));
        assertTrue(first.discountPercent().compareTo(new BigDecimal("30")) >= 0);
        assertEquals(0, first.rating().compareTo(new BigDecimal("4.6")));
        assertEquals(12345, first.reviewCount());
        assertFalse(first.sponsored());

        assertTrue(hits.get(1).sponsored());
    }

    @Test
    void treatsTypicalPriceLabelAsListPriceOnSearchCard() {
        String html = """
                <html><body>
                  <div data-component-type="s-search-result" data-asin="B0TYPICAL1">
                    <h2><a href="/dp/B0TYPICAL1"><span>Travel Mug</span></a></h2>
                    <span class="a-price"><span class="a-offscreen">$18.99</span></span>
                    <span class="a-size-base a-color-secondary">Typical price: $34.99</span>
                  </div>
                </body></html>
                """;
        List<AmazonSearchPageFetcher.SearchHit> hits = fetcher.parseHtml(html, "travel mug", 10);
        assertEquals(1, hits.size());
        assertEquals(0, hits.getFirst().priceAmount().compareTo(new BigDecimal("18.99")));
        assertEquals(0, hits.getFirst().listPrice().compareTo(new BigDecimal("34.99")));
    }
}
