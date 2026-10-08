package com.dealstoker.api.service;

import com.dealstoker.api.domain.ProductStatus;
import com.dealstoker.api.repository.ProductRepository;
import com.dealstoker.api.service.AmazonImportService.RefreshOutcome;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PriceRefreshServiceTest {

    private final ProductRepository products = mock(ProductRepository.class);
    private final AmazonImportService amazon = mock(AmazonImportService.class);
    private final List<Long> sleeps = new ArrayList<>();

    private PriceRefreshService service(int maxFailures, long pauseMs) {
        return new PriceRefreshService(products, amazon, true, "0 17 5 * * *", 300, pauseMs,
                maxFailures, sleeps::add);
    }

    private void candidates(Long... ids) {
        when(products.findPriceRefreshCandidates(eq(ProductStatus.PUBLISHED), any(Pageable.class)))
                .thenReturn(List.of(ids));
    }

    @Test
    void countsOutcomesAndPausesBetweenProducts() {
        candidates(1L, 2L, 3L, 4L);
        when(amazon.refreshPrice(1L)).thenReturn(RefreshOutcome.UPDATED);
        when(amazon.refreshPrice(2L)).thenReturn(RefreshOutcome.NO_PRICE);
        when(amazon.refreshPrice(3L)).thenReturn(RefreshOutcome.FAILED);
        when(amazon.refreshPrice(4L)).thenReturn(RefreshOutcome.UPDATED);

        PriceRefreshService.RunSummary run = service(3, 1000).refreshAll("manual");

        assertThat(run.attempted()).isEqualTo(4);
        assertThat(run.updated()).isEqualTo(2);
        assertThat(run.noPrice()).isEqualTo(1);
        assertThat(run.failed()).isEqualTo(1);
        assertThat(run.aborted()).isFalse();
        // No pause before the first product; 1-1.5s jittered pauses after.
        assertThat(sleeps).hasSize(3).allSatisfy(ms -> assertThat(ms).isBetween(1000L, 1500L));
    }

    @Test
    void stopsAfterRepeatedFailuresSoABotCheckDoesNotBurnTheWholeList() {
        candidates(1L, 2L, 3L, 4L, 5L);
        when(amazon.refreshPrice(any())).thenReturn(RefreshOutcome.FAILED);

        PriceRefreshService.RunSummary run = service(3, 0).refreshAll("schedule");

        assertThat(run.aborted()).isTrue();
        assertThat(run.attempted()).isEqualTo(3);
        verify(amazon, never()).refreshPrice(4L);
        assertThat(run.message()).contains("Stopped early");
    }

    @Test
    void aPageWithoutPriceResetsTheFailureStreak() {
        candidates(1L, 2L, 3L, 4L, 5L);
        when(amazon.refreshPrice(1L)).thenReturn(RefreshOutcome.FAILED);
        when(amazon.refreshPrice(2L)).thenReturn(RefreshOutcome.FAILED);
        when(amazon.refreshPrice(3L)).thenReturn(RefreshOutcome.NO_PRICE);
        when(amazon.refreshPrice(4L)).thenReturn(RefreshOutcome.FAILED);
        when(amazon.refreshPrice(5L)).thenReturn(RefreshOutcome.FAILED);

        PriceRefreshService.RunSummary run = service(3, 0).refreshAll("schedule");

        assertThat(run.aborted()).isFalse();
        assertThat(run.attempted()).isEqualTo(5);
    }

    @Test
    void exceptionsCountAsFailuresAndDoNotStopTheRun() {
        candidates(1L, 2L);
        when(amazon.refreshPrice(1L)).thenThrow(new IllegalStateException("boom"));
        when(amazon.refreshPrice(2L)).thenReturn(RefreshOutcome.UPDATED);

        PriceRefreshService.RunSummary run = service(3, 0).refreshAll("manual");

        assertThat(run.failed()).isEqualTo(1);
        assertThat(run.updated()).isEqualTo(1);
    }

    @Test
    void onlyOneRunAtATime() throws Exception {
        candidates(1L);
        CountDownLatch inside = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        when(amazon.refreshPrice(1L)).thenAnswer(invocation -> {
            inside.countDown();
            release.await(5, TimeUnit.SECONDS);
            return RefreshOutcome.UPDATED;
        });
        PriceRefreshService service = service(3, 0);

        assertThat(service.startManualRefresh()).isTrue();
        assertThat(inside.await(5, TimeUnit.SECONDS)).isTrue();
        assertThat(service.startManualRefresh()).isFalse();
        assertThat(service.refreshAll("schedule")).isNull();

        release.countDown();
        for (int i = 0; i < 50 && service.status().running(); i++) {
            Thread.sleep(20);
        }
        assertThat(service.status().running()).isFalse();
        assertThat(service.status().lastRun().updated()).isEqualTo(1);
    }

    @Test
    void statusReportsFreshAndStaleCounts() {
        when(products.countPriceRefreshCandidates(ProductStatus.PUBLISHED)).thenReturn(10L);
        when(products.countPricesCheckedSince(eq(ProductStatus.PUBLISHED), any())).thenReturn(7L);

        PriceRefreshService.Status status = service(3, 0).status();

        assertThat(status.total()).isEqualTo(10);
        assertThat(status.freshWithin24h()).isEqualTo(7);
        assertThat(status.stale()).isEqualTo(3);
        assertThat(status.schedule()).contains("America/New_York");
    }
}
