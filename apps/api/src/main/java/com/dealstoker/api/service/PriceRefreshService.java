package com.dealstoker.api.service;

import com.dealstoker.api.domain.ProductStatus;
import com.dealstoker.api.repository.ProductRepository;
import com.dealstoker.api.service.AmazonImportService.RefreshOutcome;
import com.dealstoker.api.util.SiteTime;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.LongConsumer;

/**
 * Daily refresh of Amazon prices for published products, least recently checked first.
 * Prices shown on the site (and on future price landing pages) must stay current, and
 * Amazon's rules expect displayed prices to be refreshed at least daily.
 *
 * <p>Requests are spaced out, and the run stops early when Amazon blocks several products
 * in a row, so a bot check never turns into hundreds of failed requests. Runs one at a time
 * per API instance.
 */
@Service
public class PriceRefreshService {

    private static final Logger log = LoggerFactory.getLogger(PriceRefreshService.class);

    /** Prices checked within this window count as fresh on the admin status. */
    public static final Duration FRESH_WINDOW = Duration.ofHours(24);

    public record RunSummary(
            String trigger,
            Instant startedAt,
            Instant finishedAt,
            int attempted,
            int updated,
            int noPrice,
            int failed,
            boolean aborted,
            String message
    ) {}

    public record Status(
            boolean enabled,
            String schedule,
            boolean running,
            RunSummary lastRun,
            long total,
            long freshWithin24h,
            long stale
    ) {}

    private final ProductRepository productRepository;
    private final AmazonImportService amazonImportService;
    private final boolean enabled;
    private final String cron;
    private final int maxPerRun;
    private final long pauseMillis;
    private final int maxConsecutiveFailures;
    private final LongConsumer sleeper;
    private final AtomicBoolean running = new AtomicBoolean(false);
    private final ExecutorService executor = Executors.newSingleThreadExecutor(runnable -> {
        Thread thread = new Thread(runnable, "price-refresh");
        thread.setDaemon(true);
        return thread;
    });
    private volatile RunSummary lastRun;

    @Autowired
    public PriceRefreshService(
            ProductRepository productRepository,
            AmazonImportService amazonImportService,
            @Value("${dealstoker.prices.refresh-enabled:true}") boolean enabled,
            @Value("${dealstoker.prices.refresh-cron:0 17 5 * * *}") String cron,
            @Value("${dealstoker.prices.max-per-run:300}") int maxPerRun,
            @Value("${dealstoker.prices.pause-ms:8000}") long pauseMillis,
            @Value("${dealstoker.prices.max-consecutive-failures:3}") int maxConsecutiveFailures
    ) {
        this(productRepository, amazonImportService, enabled, cron, maxPerRun, pauseMillis,
                maxConsecutiveFailures, PriceRefreshService::sleep);
    }

    PriceRefreshService(
            ProductRepository productRepository,
            AmazonImportService amazonImportService,
            boolean enabled,
            String cron,
            int maxPerRun,
            long pauseMillis,
            int maxConsecutiveFailures,
            LongConsumer sleeper
    ) {
        this.productRepository = productRepository;
        this.amazonImportService = amazonImportService;
        this.enabled = enabled;
        this.cron = cron;
        this.maxPerRun = Math.max(1, maxPerRun);
        this.pauseMillis = Math.max(0, pauseMillis);
        this.maxConsecutiveFailures = Math.max(1, maxConsecutiveFailures);
        this.sleeper = sleeper;
    }

    /** Every day at the configured time, US Eastern. */
    @Scheduled(cron = "${dealstoker.prices.refresh-cron:0 17 5 * * *}", zone = SiteTime.ZONE_ID)
    public void scheduledRefresh() {
        if (!enabled) {
            return;
        }
        refreshAll("schedule");
    }

    /** Starts a refresh in the background; false when one is already running. */
    public boolean startManualRefresh() {
        if (running.get()) {
            return false;
        }
        executor.execute(() -> refreshAll("manual"));
        return true;
    }

    public Status status() {
        long total = productRepository.countPriceRefreshCandidates(ProductStatus.PUBLISHED);
        long fresh = productRepository.countPricesCheckedSince(
                ProductStatus.PUBLISHED, Instant.now().minus(FRESH_WINDOW));
        return new Status(enabled, cron + " (" + SiteTime.ZONE_ID + ")", running.get(), lastRun,
                total, fresh, Math.max(0, total - fresh));
    }

    /** Runs synchronously; returns null when another run is in progress. */
    RunSummary refreshAll(String trigger) {
        if (!running.compareAndSet(false, true)) {
            log.info("Price refresh ({}) skipped: a run is already in progress", trigger);
            return null;
        }
        Instant startedAt = Instant.now();
        int attempted = 0;
        int updated = 0;
        int noPrice = 0;
        int failed = 0;
        int consecutiveFailures = 0;
        boolean aborted = false;
        String message;
        try {
            List<Long> ids = productRepository.findPriceRefreshCandidates(
                    ProductStatus.PUBLISHED, PageRequest.of(0, maxPerRun));
            log.info("Price refresh ({}) starting for {} products", trigger, ids.size());
            for (Long id : ids) {
                if (attempted > 0) {
                    pause();
                }
                attempted++;
                RefreshOutcome outcome;
                try {
                    outcome = amazonImportService.refreshPrice(id);
                } catch (RuntimeException ex) {
                    log.warn("Price refresh failed for product {}: {}", id, ex.toString());
                    outcome = RefreshOutcome.FAILED;
                }
                switch (outcome) {
                    case UPDATED -> {
                        updated++;
                        consecutiveFailures = 0;
                    }
                    case NO_PRICE -> {
                        noPrice++;
                        consecutiveFailures = 0;
                    }
                    case FAILED -> {
                        failed++;
                        consecutiveFailures++;
                    }
                }
                if (consecutiveFailures >= maxConsecutiveFailures) {
                    aborted = true;
                    break;
                }
            }
            message = aborted
                    ? "Stopped early: Amazon could not be reached for " + consecutiveFailures
                            + " products in a row (likely a bot check). The rest will be tried next run."
                    : "Checked " + attempted + " products.";
        } catch (RuntimeException ex) {
            log.error("Price refresh ({}) crashed", trigger, ex);
            message = "Price refresh crashed: " + ex.getMessage();
        } finally {
            running.set(false);
        }
        RunSummary summary = new RunSummary(trigger, startedAt, Instant.now(), attempted, updated,
                noPrice, failed, aborted, message);
        lastRun = summary;
        log.info("Price refresh ({}) done: attempted={} updated={} noPrice={} failed={} aborted={}",
                trigger, attempted, updated, noPrice, failed, aborted);
        return summary;
    }

    private void pause() {
        if (pauseMillis == 0) {
            return;
        }
        // Jitter so requests don't arrive on a fixed beat.
        sleeper.accept(pauseMillis + ThreadLocalRandom.current().nextLong(pauseMillis / 2 + 1));
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
    }

    @PreDestroy
    void shutdown() {
        executor.shutdownNow();
    }
}
