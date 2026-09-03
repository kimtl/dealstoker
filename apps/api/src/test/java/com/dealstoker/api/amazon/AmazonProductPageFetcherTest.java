package com.dealstoker.api.amazon;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class AmazonProductPageFetcherTest {

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
                    <li><span class="a-list-item">Crispy results</span></li>
                    <li><span class="a-list-item">Easy clean</span></li>
                  </ul></div>
                </body></html>
                """;
        AmazonProductPageFetcher.ScrapedProduct scraped = new AmazonProductPageFetcher().parseHtml(html);
        assertEquals("Test Air Fryer", scraped.title());
        assertEquals("https://m.media-amazon.com/images/I/test.jpg", scraped.imageUrl());
        assertEquals("A great fryer", scraped.description());
        assertNotNull(scraped.priceAmount());
        assertEquals(0, scraped.priceAmount().compareTo(new java.math.BigDecimal("49.99")));
        assertEquals("Acme", scraped.brand());
        assertEquals(2, scraped.features().size());
    }
}
