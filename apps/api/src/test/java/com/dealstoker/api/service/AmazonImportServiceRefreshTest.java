package com.dealstoker.api.service;

import com.dealstoker.api.affiliate.AffiliateLinkBuilder;
import com.dealstoker.api.amazon.AmazonProductPageFetcher;
import com.dealstoker.api.amazon.AmazonProductPageFetcher.ScrapedProduct;
import com.dealstoker.api.config.DealStokerProperties;
import com.dealstoker.api.domain.Product;
import com.dealstoker.api.domain.ProductStatus;
import com.dealstoker.api.repository.ProductRepository;
import com.dealstoker.api.service.AmazonImportService.RefreshOutcome;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AmazonImportServiceRefreshTest {

    private final AmazonProductPageFetcher fetcher = mock(AmazonProductPageFetcher.class);
    private final ProductService productService = mock(ProductService.class);
    private final ProductRepository repository = mock(ProductRepository.class);
    private final AffiliateLinkBuilder links = mock(AffiliateLinkBuilder.class);
    private AmazonImportService service;
    private Product product;

    @BeforeEach
    void setUp() {
        service = new AmazonImportService(fetcher, productService, repository,
                mock(DealStokerProperties.class), links,
                new TransactionTemplate(mock(PlatformTransactionManager.class)));
        product = new Product();
        product.setExternalId("B000TEST01");
        product.setStatus(ProductStatus.PUBLISHED);
        product.setPriceAmount(new BigDecimal("49.99"));
        when(productService.requireById(7L)).thenReturn(product);
        when(repository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(links.buildOutboundUrl(any(), anyString())).thenReturn("https://www.amazon.com/dp/B000TEST01?tag=x");
    }

    private static ScrapedProduct scraped(BigDecimal price, boolean fetched, boolean unavailable) {
        return new ScrapedProduct("Kettle", null, null, null, price, null, null, null, List.of(), List.of(),
                fetched, null, unavailable);
    }

    @Test
    void discontinuedItemIsUnpublished() {
        when(fetcher.fetch(anyString(), anyString())).thenReturn(scraped(null, true, true));

        assertThat(service.refreshPrice(7L)).isEqualTo(RefreshOutcome.UNAVAILABLE);
        assertThat(product.getStatus()).isEqualTo(ProductStatus.UNPUBLISHED);
        assertThat(product.getAvailability()).isEqualTo("Unavailable");
        assertThat(product.getLastSyncedAt()).isNull();
    }

    @Test
    void unavailableTextWithAPriceDoesNotUnpublish() {
        when(fetcher.fetch(anyString(), anyString())).thenReturn(scraped(new BigDecimal("39.99"), true, true));

        assertThat(service.refreshPrice(7L)).isEqualTo(RefreshOutcome.UPDATED);
        assertThat(product.getStatus()).isEqualTo(ProductStatus.PUBLISHED);
        assertThat(product.getPriceAmount()).isEqualByComparingTo("39.99");
        assertThat(product.getLastSyncedAt()).isNotNull();
    }

    @Test
    void failedCrawlNeverUnpublishes() {
        when(fetcher.fetch(anyString(), anyString())).thenReturn(scraped(null, false, false));

        assertThat(service.refreshPrice(7L)).isEqualTo(RefreshOutcome.FAILED);
        assertThat(product.getStatus()).isEqualTo(ProductStatus.PUBLISHED);
        verify(repository, never()).save(any(Product.class));
    }

    @Test
    void pageWithoutPriceButNotUnavailableKeepsTheProduct() {
        when(fetcher.fetch(anyString(), anyString())).thenReturn(scraped(null, true, false));

        assertThat(service.refreshPrice(7L)).isEqualTo(RefreshOutcome.NO_PRICE);
        assertThat(product.getStatus()).isEqualTo(ProductStatus.PUBLISHED);
    }
}
