package com.dealstoker.api.amazon;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AmazonProductPageFetcherLiveTest {

    @Test
    @Tag("live")
    @EnabledIfEnvironmentVariable(named = "AMAZON_LIVE_CRAWL", matches = "1")
    void crawlsLiveAmazonDetailPage() {
        AmazonProductPageFetcher fetcher = new AmazonProductPageFetcher();
        AmazonProductPageFetcher.ScrapedProduct scraped =
                fetcher.fetch("B09V3KXJPB", "https://www.amazon.com/dp/B09V3KXJPB");
        System.out.println(scraped);
        assertTrue(scraped.fetched(), scraped.fetchNote());
        assertNotNull(scraped.title());
        assertTrue(scraped.title().length() > 10);
        assertNotNull(scraped.imageUrl());
        assertNotNull(scraped.priceAmount());
        assertTrue(scraped.features() != null && !scraped.features().isEmpty());
    }
}
