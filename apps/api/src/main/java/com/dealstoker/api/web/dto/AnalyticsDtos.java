package com.dealstoker.api.web.dto;

import jakarta.validation.constraints.Size;

import java.util.List;

public final class AnalyticsDtos {
    private AnalyticsDtos() {}

    public record PageViewRequest(
            @Size(max = 500) String path,
            @Size(max = 200) String productSlug,
            @Size(max = 2000) String referrer,
            @Size(max = 128) String visitorKey,
            @Size(max = 128) String sessionKey
    ) {}

    public record DailyStat(
            String date,
            long pageViews,
            long visitors,
            long sessions,
            long productViews,
            long outboundClicks
    ) {}

    public record ProductStat(
            long productId,
            String slug,
            String title,
            long views,
            long clicks
    ) {}

    public record AnalyticsSummary(
            int rangeDays,
            long pageViews,
            long uniqueVisitors,
            long uniqueSessions,
            long productViews,
            long outboundClicks,
            List<DailyStat> daily,
            List<ProductStat> topProducts
    ) {}
}
