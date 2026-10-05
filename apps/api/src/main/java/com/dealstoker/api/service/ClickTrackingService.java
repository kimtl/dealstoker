package com.dealstoker.api.service;

import com.dealstoker.api.affiliate.AffiliateLinkBuilder;
import com.dealstoker.api.domain.ClickEvent;
import com.dealstoker.api.domain.Product;
import com.dealstoker.api.domain.ProductStatus;
import com.dealstoker.api.repository.ClickEventRepository;
import com.dealstoker.api.util.BotUserAgents;
import com.dealstoker.api.web.ApiExceptionHandler.NotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;

@Service
public class ClickTrackingService {

    /** Repeat clicks on the same product from the same session/IP inside this window count once. */
    static final Duration DEDUPE_WINDOW = Duration.ofMinutes(30);

    private final ProductService productService;
    private final ClickEventRepository clickEventRepository;
    private final AffiliateLinkBuilder affiliateLinkBuilder;

    public ClickTrackingService(
            ProductService productService,
            ClickEventRepository clickEventRepository,
            AffiliateLinkBuilder affiliateLinkBuilder
    ) {
        this.productService = productService;
        this.clickEventRepository = clickEventRepository;
        this.affiliateLinkBuilder = affiliateLinkBuilder;
    }

    @Transactional
    public String trackAndBuildRedirect(String slug, HttpServletRequest request) {
        Product product = productService.requireBySlug(slug);
        if (product.getStatus() != ProductStatus.PUBLISHED) {
            throw new NotFoundException("Product not found: " + slug);
        }

        // Everyone gets redirected; only real, first-in-window clicks are recorded.
        String userAgent = trimTo(request.getHeader("User-Agent"), 2000);
        String ipHash = hashIp(clientIp(request));
        String sessionId = trimTo(request.getParameter("sid"), 128);
        if (shouldRecord(product, request.getMethod(), userAgent, sessionId, ipHash)) {
            ClickEvent event = new ClickEvent();
            event.setProduct(product);
            event.setCategory(product.getPrimaryCategory());
            event.setReferrer(trimTo(request.getHeader("Referer"), 2000));
            event.setUserAgent(userAgent);
            event.setIpHash(ipHash);
            event.setSessionId(sessionId);
            event.setUtmSource(trimTo(request.getParameter("utm_source"), 120));
            event.setUtmMedium(trimTo(request.getParameter("utm_medium"), 120));
            event.setUtmCampaign(trimTo(request.getParameter("utm_campaign"), 120));
            clickEventRepository.save(event);
        }

        return affiliateLinkBuilder.buildOutboundUrl(
                product.getDetailPageUrl(),
                product.getExternalId()
        );
    }

    /**
     * HEAD requests (link checkers), bots and missing user agents are never recorded.
     * A repeat click on the same product within {@link #DEDUPE_WINDOW} is ignored,
     * keyed by session id when the visitor has one, otherwise by hashed IP.
     */
    boolean shouldRecord(Product product, String method, String userAgent, String sessionId, String ipHash) {
        if ("HEAD".equalsIgnoreCase(method)) {
            return false;
        }
        if (BotUserAgents.isBot(userAgent)) {
            return false;
        }
        Instant since = Instant.now().minus(DEDUPE_WINDOW);
        if (sessionId != null) {
            return !clickEventRepository.existsByProductIdAndSessionIdAndOccurredAtAfter(
                    product.getId(), sessionId, since);
        }
        if (ipHash != null) {
            return !clickEventRepository.existsByProductIdAndIpHashAndOccurredAtAfter(
                    product.getId(), ipHash, since);
        }
        return true;
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String hashIp(String ip) {
        if (ip == null || ip.isBlank()) {
            return null;
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(ip.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (Exception ex) {
            return null;
        }
    }

    private String trimTo(String value, int max) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.length() <= max ? trimmed : trimmed.substring(0, max);
    }
}
