package com.dealstoker.api.service;

import com.dealstoker.api.affiliate.AffiliateLinkBuilder;
import com.dealstoker.api.domain.ClickEvent;
import com.dealstoker.api.domain.Product;
import com.dealstoker.api.domain.ProductStatus;
import com.dealstoker.api.repository.ClickEventRepository;
import com.dealstoker.api.web.ApiExceptionHandler.NotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@Service
public class ClickTrackingService {

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

        ClickEvent event = new ClickEvent();
        event.setProduct(product);
        event.setCategory(product.getPrimaryCategory());
        event.setReferrer(trimTo(request.getHeader("Referer"), 2000));
        event.setUserAgent(trimTo(request.getHeader("User-Agent"), 2000));
        event.setIpHash(hashIp(clientIp(request)));
        event.setSessionId(trimTo(request.getParameter("sid"), 128));
        event.setUtmSource(trimTo(request.getParameter("utm_source"), 120));
        event.setUtmMedium(trimTo(request.getParameter("utm_medium"), 120));
        event.setUtmCampaign(trimTo(request.getParameter("utm_campaign"), 120));
        clickEventRepository.save(event);

        return affiliateLinkBuilder.buildOutboundUrl(product.getDetailPageUrl());
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
