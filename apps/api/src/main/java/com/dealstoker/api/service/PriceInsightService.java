package com.dealstoker.api.service;

import com.dealstoker.api.domain.Product;
import com.dealstoker.api.domain.ProductStatus;
import com.dealstoker.api.repository.ProductRepository;
import com.dealstoker.api.repository.ProductRepository.PricePoint;
import com.dealstoker.api.util.SiteTime;
import com.dealstoker.api.web.ApiExceptionHandler.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Price history for a product page, from the prices DealStoker itself recorded (daily refresh,
 * resyncs, manual edits), plus a plain verdict on whether the current price is a good one.
 * Amazon's "list price" is never used here: the comparison is only against prices we saw.
 */
@Service
public class PriceInsightService {

    /** How far back the chart and the comparison look. */
    public static final int WINDOW_DAYS = 90;
    /** No verdict until we have watched the price this long... */
    public static final int MIN_TRACKED_DAYS = 14;
    /** ...and recorded at least this many daily prices. */
    public static final int MIN_POINTS = 5;

    public enum Verdict {
        /** Not enough history yet to judge. */
        TRACKING,
        /** At (or below) the lowest price recorded in the window. */
        LOWEST,
        /** Clearly under the typical (median) price. */
        BELOW_TYPICAL,
        /** Close to the typical price. */
        TYPICAL,
        /** Clearly above the typical price; waiting may pay off. */
        ABOVE_TYPICAL,
        /** The price has not moved at all in the window. */
        STEADY
    }

    public record Point(String date, BigDecimal price) {}

    public record PriceHistory(
            String currency,
            BigDecimal current,
            List<Point> points,
            /** First day we recorded a price for this product (ISO date), or null. */
            String trackedSince,
            /** Days from trackedSince to today, inclusive. */
            int trackedDays,
            /** Days the comparison covers: trackedDays capped at WINDOW_DAYS. */
            int windowDays,
            BigDecimal lowest,
            BigDecimal highest,
            /** Median of the daily prices in the window. */
            BigDecimal typical,
            Verdict verdict
    ) {}

    private final ProductRepository productRepository;

    public PriceInsightService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public PriceHistory forPublishedSlug(String slug) {
        Product product = productRepository.findBySlugAndStatus(slug, ProductStatus.PUBLISHED)
                .orElseThrow(() -> new NotFoundException("Product not found: " + slug));
        LocalDate today = LocalDate.now(SiteTime.ZONE);
        List<PricePoint> rows = productRepository.findPriceHistory(
                product.getId(), today.minusDays(WINDOW_DAYS - 1L));
        LocalDate trackedSince = productRepository.findPriceTrackedSince(product.getId());
        List<Point> points = rows.stream()
                .map(row -> new Point(row.getObservedOn().toString(), row.getPriceAmount()))
                .toList();
        return compute(product.getCurrency(), product.getPriceAmount(), points, trackedSince, today);
    }

    /** Pure calculation, kept separate so it can be tested without a database. */
    static PriceHistory compute(
            String currency,
            BigDecimal current,
            List<Point> points,
            LocalDate trackedSince,
            LocalDate today
    ) {
        String code = currency == null || currency.isBlank() ? "USD" : currency;
        int trackedDays = trackedSince == null
                ? 0
                : (int) Math.max(1, ChronoUnit.DAYS.between(trackedSince, today) + 1);
        int windowDays = Math.min(trackedDays, WINDOW_DAYS);
        if (points.isEmpty()) {
            return new PriceHistory(code, current, points, isoOrNull(trackedSince), trackedDays, windowDays,
                    null, null, null, Verdict.TRACKING);
        }
        List<BigDecimal> prices = points.stream().map(Point::price).sorted().toList();
        BigDecimal lowest = prices.getFirst();
        BigDecimal highest = prices.getLast();
        BigDecimal typical = median(prices);
        Verdict verdict = verdict(current, lowest, highest, typical, trackedDays, points.size());
        return new PriceHistory(code, current, points, isoOrNull(trackedSince), trackedDays, windowDays,
                lowest, highest, typical, verdict);
    }

    static Verdict verdict(
            BigDecimal current,
            BigDecimal lowest,
            BigDecimal highest,
            BigDecimal typical,
            int trackedDays,
            int pointCount
    ) {
        if (current == null || trackedDays < MIN_TRACKED_DAYS || pointCount < MIN_POINTS) {
            return Verdict.TRACKING;
        }
        if (highest.compareTo(lowest) == 0) {
            return Verdict.STEADY;
        }
        if (current.compareTo(lowest) <= 0) {
            return Verdict.LOWEST;
        }
        if (current.compareTo(typical.multiply(new BigDecimal("0.97"))) <= 0) {
            return Verdict.BELOW_TYPICAL;
        }
        if (current.compareTo(typical.multiply(new BigDecimal("1.05"))) >= 0) {
            return Verdict.ABOVE_TYPICAL;
        }
        return Verdict.TYPICAL;
    }

    private static BigDecimal median(List<BigDecimal> sorted) {
        int n = sorted.size();
        if (n % 2 == 1) {
            return sorted.get(n / 2);
        }
        return sorted.get(n / 2 - 1).add(sorted.get(n / 2))
                .divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
    }

    private static String isoOrNull(LocalDate date) {
        return date == null ? null : date.toString();
    }
}
