package com.dealstoker.api.service;

import com.dealstoker.api.service.PriceInsightService.PriceHistory;
import com.dealstoker.api.service.PriceInsightService.Point;
import com.dealstoker.api.service.PriceInsightService.Verdict;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PriceInsightServiceTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 10);

    /** One price per day ending today, oldest first. */
    private static List<Point> daily(String... prices) {
        List<Point> points = new ArrayList<>();
        for (int i = 0; i < prices.length; i++) {
            LocalDate day = TODAY.minusDays(prices.length - 1L - i);
            points.add(new Point(day.toString(), new BigDecimal(prices[i])));
        }
        return points;
    }

    private static PriceHistory compute(String current, List<Point> points, int trackedDays) {
        return PriceInsightService.compute("USD", new BigDecimal(current), points,
                TODAY.minusDays(trackedDays - 1L), TODAY);
    }

    @Test
    void noVerdictUntilTwoWeeksOfHistory() {
        PriceHistory history = compute("40.00", daily("50.00", "45.00", "48.00", "50.00", "40.00"), 5);
        assertThat(history.verdict()).isEqualTo(Verdict.TRACKING);
        assertThat(history.trackedDays()).isEqualTo(5);
        assertThat(history.lowest()).isEqualByComparingTo("40.00");
    }

    @Test
    void noVerdictWithTooFewRecordedDays() {
        PriceHistory history = compute("40.00", daily("50.00", "40.00"), 30);
        assertThat(history.verdict()).isEqualTo(Verdict.TRACKING);
    }

    @Test
    void lowestPriceInWindow() {
        PriceHistory history = compute("39.99",
                daily("49.99", "49.99", "47.99", "49.99", "44.99", "49.99", "39.99"), 20);
        assertThat(history.verdict()).isEqualTo(Verdict.LOWEST);
        assertThat(history.windowDays()).isEqualTo(20);
        assertThat(history.typical()).isEqualByComparingTo("49.99");
        assertThat(history.highest()).isEqualByComparingTo("49.99");
    }

    @Test
    void belowTypicalButNotLowest() {
        PriceHistory history = compute("44.99",
                daily("49.99", "39.99", "49.99", "49.99", "49.99", "44.99"), 30);
        assertThat(history.verdict()).isEqualTo(Verdict.BELOW_TYPICAL);
    }

    @Test
    void aboveTypicalSuggestsWaiting() {
        PriceHistory history = compute("59.99",
                daily("49.99", "49.99", "47.99", "49.99", "49.99", "59.99"), 30);
        assertThat(history.verdict()).isEqualTo(Verdict.ABOVE_TYPICAL);
    }

    @Test
    void typicalWithinSmallBand() {
        PriceHistory history = compute("50.99",
                daily("49.99", "48.99", "50.99", "49.99", "51.99", "50.99"), 30);
        assertThat(history.verdict()).isEqualTo(Verdict.TYPICAL);
    }

    @Test
    void steadyWhenPriceNeverMoved() {
        PriceHistory history = compute("29.99",
                daily("29.99", "29.99", "29.99", "29.99", "29.99"), 40);
        assertThat(history.verdict()).isEqualTo(Verdict.STEADY);
    }

    @Test
    void windowIsCappedAtNinetyDays() {
        PriceHistory history = compute("29.99", daily("29.99", "29.99", "29.99", "29.99", "29.99"), 400);
        assertThat(history.windowDays()).isEqualTo(PriceInsightService.WINDOW_DAYS);
        assertThat(history.trackedDays()).isEqualTo(400);
    }

    @Test
    void emptyHistory() {
        PriceHistory history = PriceInsightService.compute(null, null, List.of(), null, TODAY);
        assertThat(history.verdict()).isEqualTo(Verdict.TRACKING);
        assertThat(history.currency()).isEqualTo("USD");
        assertThat(history.trackedSince()).isNull();
    }
}
