package com.dealstoker.api.service;

import com.dealstoker.api.domain.PageViewEvent;
import com.dealstoker.api.repository.ClickEventRepository;
import com.dealstoker.api.repository.PageViewEventRepository;
import com.dealstoker.api.repository.ProductRepository;
import com.dealstoker.api.web.dto.AnalyticsDtos.AnalyticsSummary;
import com.dealstoker.api.web.dto.AnalyticsDtos.DailyStat;
import com.dealstoker.api.web.dto.AnalyticsDtos.PageViewRequest;
import com.dealstoker.api.web.dto.AnalyticsDtos.ProductStat;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {

    private final PageViewEventRepository pageViewEventRepository;
    private final ClickEventRepository clickEventRepository;
    private final ProductRepository productRepository;

    public AnalyticsService(
            PageViewEventRepository pageViewEventRepository,
            ClickEventRepository clickEventRepository,
            ProductRepository productRepository
    ) {
        this.pageViewEventRepository = pageViewEventRepository;
        this.clickEventRepository = clickEventRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public void recordPageView(PageViewRequest request, HttpServletRequest httpRequest) {
        String path = normalizePath(request != null ? request.path() : null);
        if (path == null || shouldIgnorePath(path)) {
            return;
        }

        PageViewEvent event = new PageViewEvent();
        event.setPath(path);
        event.setReferrer(trimTo(request != null ? request.referrer() : null, 2000));
        if (event.getReferrer() == null) {
            event.setReferrer(trimTo(httpRequest.getHeader("Referer"), 2000));
        }
        event.setUserAgent(trimTo(httpRequest.getHeader("User-Agent"), 2000));
        event.setIpHash(hashIp(clientIp(httpRequest)));
        event.setVisitorKey(trimTo(request != null ? request.visitorKey() : null, 128));
        event.setSessionKey(trimTo(request != null ? request.sessionKey() : null, 128));

        String productSlug = request != null ? blankToNull(request.productSlug()) : null;
        if (productSlug == null) {
            productSlug = extractProductSlug(path);
        }
        if (productSlug != null) {
            productRepository.findBySlug(productSlug).ifPresent(event::setProduct);
        }

        pageViewEventRepository.save(event);
    }

    @Transactional(readOnly = true)
    public AnalyticsSummary summary(int days) {
        int rangeDays = Math.max(1, Math.min(days, 90));
        Instant since = Instant.now().minus(rangeDays, ChronoUnit.DAYS);

        long pageViews = pageViewEventRepository.countByOccurredAtGreaterThanEqual(since);
        long uniqueVisitors = pageViewEventRepository.countDistinctVisitorsSince(since);
        long uniqueSessions = pageViewEventRepository.countDistinctSessionsSince(since);
        long productViews = pageViewEventRepository.countByProductIsNotNullAndOccurredAtGreaterThanEqual(since);
        long outboundClicks = clickEventRepository.countByOccurredAtGreaterThanEqual(since);

        Map<LocalDate, long[]> dailyMap = new LinkedHashMap<>();
        LocalDate startDay = LocalDate.ofInstant(since, ZoneOffset.UTC);
        LocalDate endDay = LocalDate.now(ZoneOffset.UTC);
        for (LocalDate day = startDay; !day.isAfter(endDay); day = day.plusDays(1)) {
            dailyMap.put(day, new long[]{0, 0, 0, 0, 0});
        }

        for (Object[] row : pageViewEventRepository.dailyStatsSince(since)) {
            LocalDate day = toLocalDate(row[0]);
            if (day == null) continue;
            long[] bucket = dailyMap.computeIfAbsent(day, ignored -> new long[]{0, 0, 0, 0, 0});
            bucket[0] = toLong(row[1]);
            bucket[1] = toLong(row[2]);
            bucket[2] = toLong(row[3]);
            bucket[3] = toLong(row[4]);
        }

        for (Object[] row : clickEventRepository.dailyClicksSince(since)) {
            LocalDate day = toLocalDate(row[0]);
            if (day == null) continue;
            long[] bucket = dailyMap.computeIfAbsent(day, ignored -> new long[]{0, 0, 0, 0, 0});
            bucket[4] = toLong(row[1]);
        }

        List<DailyStat> daily = dailyMap.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new DailyStat(
                        entry.getKey().toString(),
                        entry.getValue()[0],
                        entry.getValue()[1],
                        entry.getValue()[2],
                        entry.getValue()[3],
                        entry.getValue()[4]
                ))
                .toList();

        return new AnalyticsSummary(
                rangeDays,
                pageViews,
                uniqueVisitors,
                uniqueSessions,
                productViews,
                outboundClicks,
                daily,
                topProducts(since, 25)
        );
    }

    private List<ProductStat> topProducts(Instant since, int limit) {
        Map<Long, ProductStatBuilder> builders = new HashMap<>();

        int fetchLimit = Math.min(Math.max(limit * 2, limit), 100);
        for (Object[] row : pageViewEventRepository.topProductsByViewsSince(since, fetchLimit)) {
            long productId = toLong(row[0]);
            ProductStatBuilder builder = builders.computeIfAbsent(
                    productId,
                    id -> new ProductStatBuilder(id, String.valueOf(row[1]), String.valueOf(row[2]))
            );
            builder.views = toLong(row[3]);
        }

        for (Object[] row : clickEventRepository.topProductsByClicksSince(since, fetchLimit)) {
            long productId = toLong(row[0]);
            ProductStatBuilder builder = builders.computeIfAbsent(
                    productId,
                    id -> new ProductStatBuilder(id, String.valueOf(row[1]), String.valueOf(row[2]))
            );
            builder.clicks = toLong(row[3]);
        }

        return builders.values().stream()
                .sorted(Comparator
                        .comparingLong((ProductStatBuilder b) -> b.views + b.clicks).reversed()
                        .thenComparing(b -> b.title, String.CASE_INSENSITIVE_ORDER))
                .limit(limit)
                .map(b -> new ProductStat(b.productId, b.slug, b.title, b.views, b.clicks))
                .toList();
    }

    private static class ProductStatBuilder {
        private final long productId;
        private final String slug;
        private final String title;
        private long views;
        private long clicks;

        private ProductStatBuilder(long productId, String slug, String title) {
            this.productId = productId;
            this.slug = slug;
            this.title = title;
        }
    }

    private String normalizePath(String path) {
        String value = blankToNull(path);
        if (value == null) {
            return null;
        }
        if (!value.startsWith("/")) {
            value = "/" + value;
        }
        int query = value.indexOf('?');
        if (query >= 0) {
            value = value.substring(0, query);
        }
        if (value.length() > 500) {
            value = value.substring(0, 500);
        }
        return value;
    }

    private boolean shouldIgnorePath(String path) {
        String lower = path.toLowerCase();
        return lower.startsWith("/admin")
                || lower.startsWith("/api")
                || lower.startsWith("/go/")
                || lower.equals("/robots.txt")
                || lower.equals("/sitemap.xml")
                || lower.equals("/favicon.ico");
    }

    private String extractProductSlug(String path) {
        if (path.startsWith("/p/")) {
            String slug = path.substring(3);
            int slash = slug.indexOf('/');
            if (slash >= 0) {
                slug = slug.substring(0, slash);
            }
            return blankToNull(slug);
        }
        return null;
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

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private LocalDate toLocalDate(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof LocalDate localDate) {
            return localDate;
        }
        if (value instanceof java.sql.Date sqlDate) {
            return sqlDate.toLocalDate();
        }
        return LocalDate.parse(String.valueOf(value));
    }

    private long toLong(Object value) {
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(String.valueOf(value));
    }
}
