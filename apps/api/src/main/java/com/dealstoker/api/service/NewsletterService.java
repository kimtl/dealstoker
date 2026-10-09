package com.dealstoker.api.service;

import com.dealstoker.api.config.DealStokerProperties;
import com.dealstoker.api.domain.Guide;
import com.dealstoker.api.domain.GuideStatus;
import com.dealstoker.api.domain.NewsletterIssue;
import com.dealstoker.api.domain.NewsletterIssueStatus;
import com.dealstoker.api.domain.Subscriber;
import com.dealstoker.api.domain.SubscriberStatus;
import com.dealstoker.api.repository.GuideRepository;
import com.dealstoker.api.repository.NewsletterIssueRepository;
import com.dealstoker.api.repository.SubscriberRepository;
import com.dealstoker.api.service.NewsletterRenderer.GuideItem;
import com.dealstoker.api.service.NewsletterRenderer.IssueContent;
import com.dealstoker.api.service.NewsletterRenderer.ProductItem;
import com.dealstoker.api.service.NewsletterRenderer.Rendered;
import com.dealstoker.api.util.SiteTime;
import com.dealstoker.api.web.ApiExceptionHandler.NotFoundException;
import com.dealstoker.api.web.dto.ProductDtos.ProductSummary;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.json.JsonMapper;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.LongConsumer;

/**
 * Weekly newsletter: builds a draft from new guides, the most viewed products and the biggest
 * discounts, lets the admin preview / test / edit it, and sends it to active subscribers in the
 * background. Every email carries a one-click unsubscribe link and header, and the sender's
 * postal address (CAN-SPAM); sending is refused until both email and the address are set.
 */
@Service
public class NewsletterService {

    private static final Logger log = LoggerFactory.getLogger(NewsletterService.class);
    private static final JsonMapper MAPPER = JsonMapper.builder().build();

    static final int MAX_GUIDES = 3;
    static final int MAX_PRODUCTS = 4;
    static final int MIN_DISCOUNT_PERCENT = 10;

    public record Readiness(boolean emailConfigured, boolean postalAddressSet, String from) {
        public boolean ready() {
            return emailConfigured && postalAddressSet;
        }
    }

    private final SubscriberRepository subscribers;
    private final NewsletterIssueRepository issues;
    private final GuideRepository guides;
    private final ProductService productService;
    private final EmailSender emailSender;
    private final TransactionTemplate tx;
    private final String baseUrl;
    private final String postalAddress;
    private final boolean scheduleEnabled;
    private final boolean autoSend;
    private final long pauseMillis;
    private final LongConsumer sleeper;
    private final ExecutorService executor = Executors.newSingleThreadExecutor(runnable -> {
        Thread thread = new Thread(runnable, "newsletter-send");
        thread.setDaemon(true);
        return thread;
    });

    @org.springframework.beans.factory.annotation.Autowired
    public NewsletterService(
            SubscriberRepository subscribers,
            NewsletterIssueRepository issues,
            GuideRepository guides,
            ProductService productService,
            EmailSender emailSender,
            TransactionTemplate tx,
            DealStokerProperties properties,
            @Value("${dealstoker.newsletter.postal-address:}") String postalAddress,
            @Value("${dealstoker.newsletter.schedule-enabled:true}") boolean scheduleEnabled,
            @Value("${dealstoker.newsletter.auto-send:false}") boolean autoSend,
            @Value("${dealstoker.newsletter.send-pause-ms:600}") long pauseMillis
    ) {
        this(subscribers, issues, guides, productService, emailSender, tx, properties, postalAddress,
                scheduleEnabled, autoSend, pauseMillis, NewsletterService::sleep);
    }

    NewsletterService(
            SubscriberRepository subscribers,
            NewsletterIssueRepository issues,
            GuideRepository guides,
            ProductService productService,
            EmailSender emailSender,
            TransactionTemplate tx,
            DealStokerProperties properties,
            String postalAddress,
            boolean scheduleEnabled,
            boolean autoSend,
            long pauseMillis,
            LongConsumer sleeper
    ) {
        this.subscribers = subscribers;
        this.issues = issues;
        this.guides = guides;
        this.productService = productService;
        this.emailSender = emailSender;
        this.tx = tx;
        this.baseUrl = properties.appBaseUrl() == null ? "https://www.dealstoker.com"
                : properties.appBaseUrl().replaceAll("/$", "");
        this.postalAddress = postalAddress == null ? "" : postalAddress.trim();
        this.scheduleEnabled = scheduleEnabled;
        this.autoSend = autoSend;
        this.pauseMillis = Math.max(0, pauseMillis);
        this.sleeper = sleeper;
    }

    public Readiness readiness() {
        return new Readiness(emailSender.isConfigured(), !postalAddress.isBlank(), emailSender.from());
    }

    public boolean isAutoSend() {
        return autoSend;
    }

    public boolean isScheduleEnabled() {
        return scheduleEnabled;
    }

    // ---------- content ----------

    /** Picks this week's content: new guides, most viewed products, biggest discounts (no repeats). */
    public IssueContent buildContent() {
        Instant weekAgo = Instant.now().minus(Duration.ofDays(7));
        List<Guide> recent = guides.findByStatusOrderByPublishedAtDescUpdatedAtDesc(
                GuideStatus.PUBLISHED, PageRequest.of(0, 10)).getContent();
        List<Guide> picked = recent.stream()
                .filter(g -> g.getPublishedAt() != null && g.getPublishedAt().isAfter(weekAgo))
                .limit(MAX_GUIDES).toList();
        if (picked.isEmpty()) {
            picked = recent.stream().limit(2).toList();
        }
        List<GuideItem> guideItems = picked.stream()
                .map(g -> new GuideItem(g.getSlug(), g.getTitle(), g.getTitleKo(), g.getExcerpt(),
                        g.getExcerptKo(), g.getCoverImageUrl()))
                .toList();

        Set<String> used = new HashSet<>();
        List<ProductItem> topViewed = new ArrayList<>();
        for (ProductSummary p : productService.topViewPublished(MAX_PRODUCTS + 2)) {
            if (topViewed.size() < MAX_PRODUCTS && used.add(p.slug())) {
                topViewed.add(item(p));
            }
        }
        List<ProductItem> deals = new ArrayList<>();
        for (ProductSummary p : productService.listPublished(null, null, "discount", 0, 12).items()) {
            ProductItem item = item(p);
            Integer pct = item.discountPercent();
            if (deals.size() < MAX_PRODUCTS && pct != null && pct >= MIN_DISCOUNT_PERCENT && used.add(p.slug())) {
                deals.add(item);
            }
        }
        return new IssueContent(guideItems, topViewed, deals);
    }

    private static ProductItem item(ProductSummary p) {
        return new ProductItem(p.slug(), p.title(), p.imageUrl(), p.priceAmount(), p.listPrice(), p.currency(),
                p.rating(), p.reviewCount(), p.priceCheckedAt());
    }

    // ---------- issues ----------

    public NewsletterIssue createDraft() {
        IssueContent content = buildContent();
        NewsletterIssue issue = new NewsletterIssue();
        String lead = content.guides().isEmpty() ? null : content.guides().get(0).title();
        String leadKo = content.guides().isEmpty() ? null
                : firstNonBlank(content.guides().get(0).titleKo(), content.guides().get(0).title());
        issue.setSubject(lead != null ? "This week on DealStoker: " + lead : "This week's picks on DealStoker");
        issue.setSubjectKo(leadKo != null ? "이번 주 DealStoker: " + leadKo : "이번 주 DealStoker 추천");
        issue.setContentJson(MAPPER.writeValueAsString(content));
        return issues.save(issue);
    }

    public NewsletterIssue require(Long id) {
        return issues.findById(id).orElseThrow(() -> new NotFoundException("Newsletter issue not found: " + id));
    }

    public List<NewsletterIssue> recentIssues(int limit) {
        return issues.findAllByOrderByCreatedAtDesc(PageRequest.of(0, Math.max(1, Math.min(limit, 50))));
    }

    public NewsletterIssue update(Long id, String subject, String subjectKo, String intro, String introKo) {
        NewsletterIssue issue = require(id);
        requireDraft(issue);
        if (subject != null && !subject.isBlank()) issue.setSubject(trim(subject, 200));
        issue.setSubjectKo(subjectKo == null || subjectKo.isBlank() ? null : trim(subjectKo, 200));
        issue.setIntro(intro == null || intro.isBlank() ? null : intro.trim());
        issue.setIntroKo(introKo == null || introKo.isBlank() ? null : introKo.trim());
        return issues.save(issue);
    }

    public void delete(Long id) {
        NewsletterIssue issue = require(id);
        requireDraft(issue);
        issues.delete(issue);
    }

    public IssueContent content(NewsletterIssue issue) {
        return MAPPER.readValue(issue.getContentJson(), IssueContent.class);
    }

    public Rendered render(NewsletterIssue issue, String locale, String token) {
        boolean ko = "ko".equals(locale);
        String subject = ko ? firstNonBlank(issue.getSubjectKo(), issue.getSubject()) : issue.getSubject();
        String intro = ko ? firstNonBlank(issue.getIntroKo(), issue.getIntro()) : issue.getIntro();
        return NewsletterRenderer.render(content(issue), new NewsletterRenderer.Context(
                issue.getId(), ko ? "ko" : "en", subject, intro, baseUrl, unsubscribeUrl(token, ko),
                postalAddress.isBlank() ? "[Postal address not set: NEWSLETTER_POSTAL_ADDRESS]" : postalAddress));
    }

    String unsubscribeUrl(String token, boolean ko) {
        return baseUrl + "/newsletter/unsubscribe?token=" + token + (ko ? "&hl=ko" : "");
    }

    /** RFC 8058 one-click unsubscribe target (mail apps POST here directly). */
    String oneClickUrl(String token) {
        return baseUrl + "/api/backend/api/v1/newsletter/unsubscribe?token=" + token;
    }

    public void sendTest(Long id, String email, String locale) {
        requireReady();
        if (!SubscriptionService.isValidEmail(SubscriptionService.normalizeEmail(email))) {
            throw new IllegalArgumentException("Enter a valid email address for the test.");
        }
        NewsletterIssue issue = require(id);
        Rendered rendered = render(issue, locale, "test-preview");
        emailSender.send(new EmailSender.Email(email.trim(), "[TEST] " + rendered.subject(), rendered.html(),
                rendered.text(), Map.of()));
    }

    /** Starts sending in the background; returns the number of recipients. */
    public int startSend(Long id) {
        requireReady();
        NewsletterIssue issue = require(id);
        requireDraft(issue);
        List<Subscriber> recipients = subscribers.findByStatusOrderByIdAsc(SubscriberStatus.ACTIVE);
        if (recipients.isEmpty()) {
            throw new IllegalArgumentException("There are no confirmed subscribers yet.");
        }
        issue.setStatus(NewsletterIssueStatus.SENDING);
        issue.setRecipientCount(recipients.size());
        issues.save(issue);
        List<Long> ids = recipients.stream().map(Subscriber::getId).toList();
        executor.execute(() -> sendAll(id, ids));
        return ids.size();
    }

    void sendAll(Long issueId, List<Long> subscriberIds) {
        NewsletterIssue issue = require(issueId);
        int sent = 0;
        int failed = 0;
        for (Long subscriberId : subscriberIds) {
            Subscriber subscriber = subscribers.findById(subscriberId).orElse(null);
            // Someone may have unsubscribed while the send was running.
            if (subscriber == null || subscriber.getStatus() != SubscriberStatus.ACTIVE) {
                continue;
            }
            if (sent + failed > 0) {
                sleeper.accept(pauseMillis);
            }
            try {
                Rendered rendered = render(issue, subscriber.getLocale(), subscriber.getToken());
                emailSender.send(new EmailSender.Email(subscriber.getEmail(), rendered.subject(), rendered.html(),
                        rendered.text(), Map.of(
                                "List-Unsubscribe", "<" + oneClickUrl(subscriber.getToken()) + ">",
                                "List-Unsubscribe-Post", "List-Unsubscribe=One-Click")));
                subscriber.setLastSentAt(Instant.now());
                subscribers.save(subscriber);
                sent++;
            } catch (RuntimeException ex) {
                failed++;
                log.warn("Newsletter {} failed for subscriber {}: {}", issueId, subscriberId, ex.getMessage());
            }
        }
        int finalSent = sent;
        int finalFailed = failed;
        tx.executeWithoutResult(status -> {
            NewsletterIssue fresh = require(issueId);
            fresh.setStatus(NewsletterIssueStatus.SENT);
            fresh.setSentCount(finalSent);
            fresh.setFailedCount(finalFailed);
            fresh.setSentAt(Instant.now());
            issues.save(fresh);
        });
        log.info("Newsletter {} sent: {} delivered to provider, {} failed", issueId, sent, failed);
    }

    /** Weekly: create a draft (and send it when auto-send is on). US Eastern time. */
    @Scheduled(cron = "${dealstoker.newsletter.cron:0 13 8 * * THU}", zone = SiteTime.ZONE_ID)
    public void weekly() {
        if (!scheduleEnabled || issues.existsByCreatedAtAfter(Instant.now().minus(Duration.ofDays(6)))) {
            return;
        }
        IssueContent content = buildContent();
        if (content.isEmpty()) {
            log.info("Weekly newsletter skipped: nothing to feature");
            return;
        }
        NewsletterIssue draft = createDraft();
        log.info("Weekly newsletter draft {} created", draft.getId());
        if (autoSend && readiness().ready() && subscribers.countByStatus(SubscriberStatus.ACTIVE) > 0) {
            startSend(draft.getId());
        }
    }

    private void requireReady() {
        Readiness readiness = readiness();
        if (!readiness.emailConfigured()) {
            throw new IllegalArgumentException("Email is not configured. Set RESEND_API_KEY and NEWSLETTER_FROM.");
        }
        if (!readiness.postalAddressSet()) {
            throw new IllegalArgumentException(
                    "Set NEWSLETTER_POSTAL_ADDRESS first: US law (CAN-SPAM) requires a postal address in every newsletter.");
        }
    }

    private static void requireDraft(NewsletterIssue issue) {
        if (issue.getStatus() != NewsletterIssueStatus.DRAFT) {
            throw new IllegalArgumentException("Only draft issues can be changed or sent.");
        }
    }

    private static String firstNonBlank(String a, String b) {
        return a != null && !a.isBlank() ? a : b;
    }

    private static String trim(String value, int max) {
        String trimmed = value.trim();
        return trimmed.length() > max ? trimmed.substring(0, max) : trimmed;
    }

    private static void sleep(long millis) {
        if (millis <= 0) return;
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
