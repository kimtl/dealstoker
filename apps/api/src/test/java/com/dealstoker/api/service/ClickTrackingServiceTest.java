package com.dealstoker.api.service;

import com.dealstoker.api.affiliate.AffiliateLinkBuilder;
import com.dealstoker.api.domain.Product;
import com.dealstoker.api.domain.ProductStatus;
import com.dealstoker.api.repository.ClickEventRepository;
import com.dealstoker.api.util.IpHasher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ClickTrackingServiceTest {

    private static final String CHROME =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
    private static final String TARGET = "https://www.amazon.com/dp/B0BSHF7WHW?tag=dealstoker01-20";

    private ClickEventRepository clicks;
    private ClickTrackingService service;

    @BeforeEach
    void setUp() {
        ProductService products = mock(ProductService.class);
        clicks = mock(ClickEventRepository.class);
        AffiliateLinkBuilder links = mock(AffiliateLinkBuilder.class);

        Product product = spy(new Product());
        when(product.getId()).thenReturn(42L);
        product.setStatus(ProductStatus.PUBLISHED);
        product.setDetailPageUrl("https://www.amazon.com/dp/B0BSHF7WHW");
        product.setExternalId("B0BSHF7WHW");
        when(products.requireBySlug("cosori")).thenReturn(product);
        when(links.buildOutboundUrl(anyString(), anyString())).thenReturn(TARGET);

        service = new ClickTrackingService(products, clicks, links, new IpHasher("test-secret-test-secret-test-secret"));
    }

    private MockHttpServletRequest request(String method, String userAgent) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, "/go/cosori");
        if (userAgent != null) {
            request.addHeader("User-Agent", userAgent);
        }
        request.addHeader("X-Forwarded-For", "203.0.113.7");
        return request;
    }

    @Test
    void recordsARealBrowserClick() {
        assertEquals(TARGET, service.trackAndBuildRedirect("cosori", request("GET", CHROME)));
        verify(clicks, times(1)).save(any());
    }

    @Test
    void headRequestRedirectsButIsNotRecorded() {
        assertEquals(TARGET, service.trackAndBuildRedirect("cosori", request("HEAD", CHROME)));
        verify(clicks, never()).save(any());
    }

    @Test
    void botsAndMissingUserAgentsRedirectButAreNotRecorded() {
        service.trackAndBuildRedirect("cosori", request("GET", "AdsBot-Google (+http://www.google.com/adsbot.html)"));
        service.trackAndBuildRedirect("cosori", request("GET", null));
        verify(clicks, never()).save(any());
    }

    @Test
    void repeatClickFromSameSessionIsIgnored() {
        when(clicks.existsByProductIdAndSessionIdAndOccurredAtAfter(eq(42L), eq("s1"), any(Instant.class)))
                .thenReturn(true);
        MockHttpServletRequest request = request("GET", CHROME);
        request.setParameter("sid", "s1");
        service.trackAndBuildRedirect("cosori", request);
        verify(clicks, never()).save(any());
        // Session wins over IP when present.
        verify(clicks, never()).existsByProductIdAndIpHashAndOccurredAtAfter(anyLong(), anyString(), any());
    }

    @Test
    void repeatClickFromSameIpWithoutSessionIsIgnored() {
        when(clicks.existsByProductIdAndIpHashAndOccurredAtAfter(eq(42L), anyString(), any(Instant.class)))
                .thenReturn(true);
        service.trackAndBuildRedirect("cosori", request("GET", CHROME));
        verify(clicks, never()).save(any());
    }
}
