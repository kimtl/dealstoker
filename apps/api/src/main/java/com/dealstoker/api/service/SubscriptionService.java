package com.dealstoker.api.service;

import com.dealstoker.api.config.DealStokerProperties;
import com.dealstoker.api.domain.Subscriber;
import com.dealstoker.api.domain.SubscriberStatus;
import com.dealstoker.api.repository.SubscriberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Base64;
import java.util.Deque;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

/** Double opt-in sign-up, confirmation and unsubscribe for the newsletter. */
@Service
public class SubscriptionService {

    private static final Logger log = LoggerFactory.getLogger(SubscriptionService.class);
    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]{1,64}@[^\\s@]+\\.[^\\s@]{2,}$");
    private static final SecureRandom RANDOM = new SecureRandom();

    /** Sign-ups allowed per client IP per hour (stops using the form to mail strangers). */
    static final int MAX_SIGNUPS_PER_HOUR = 5;
    /** Don't resend a confirmation email to the same address more often than this. */
    static final Duration CONFIRMATION_COOLDOWN = Duration.ofMinutes(10);

    public enum Outcome { CONFIRMATION_SENT, ALREADY_ACTIVE, IGNORED }

    private final SubscriberRepository subscribers;
    private final EmailSender emailSender;
    private final String baseUrl;
    private final Map<String, Deque<Instant>> signupsByIp = new ConcurrentHashMap<>();

    public SubscriptionService(
            SubscriberRepository subscribers,
            EmailSender emailSender,
            DealStokerProperties properties
    ) {
        this.subscribers = subscribers;
        this.emailSender = emailSender;
        this.baseUrl = properties.appBaseUrl() == null ? "https://www.dealstoker.com"
                : properties.appBaseUrl().replaceAll("/$", "");
    }

    public static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    public static boolean isValidEmail(String email) {
        return email != null && email.length() <= 254 && EMAIL.matcher(email).matches();
    }

    static String newToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * Starts (or restarts) a subscription. The caller should answer the same way whatever the
     * outcome, so the form can't be used to find out who is subscribed.
     */
    @Transactional
    public Outcome subscribe(String rawEmail, String locale, String source, String clientKey) {
        String email = normalizeEmail(rawEmail);
        if (!isValidEmail(email)) {
            throw new IllegalArgumentException("Please enter a valid email address.");
        }
        if (clientKey != null && !allowSignup(clientKey)) {
            throw new IllegalArgumentException("Too many sign-ups from this network. Please try again later.");
        }
        Subscriber subscriber = subscribers.findByEmail(email).orElseGet(() -> {
            Subscriber created = new Subscriber();
            created.setEmail(email);
            created.setToken(newToken());
            return created;
        });
        if (subscriber.getStatus() == SubscriberStatus.ACTIVE) {
            return Outcome.ALREADY_ACTIVE;
        }
        Instant now = Instant.now();
        if (subscriber.getStatus() == SubscriberStatus.PENDING && subscriber.getConfirmationSentAt() != null
                && subscriber.getConfirmationSentAt().isAfter(now.minus(CONFIRMATION_COOLDOWN))) {
            return Outcome.IGNORED;
        }
        subscriber.setStatus(SubscriberStatus.PENDING);
        subscriber.setLocale("ko".equalsIgnoreCase(locale) ? "ko" : "en");
        if (source != null && !source.isBlank()) {
            subscriber.setSource(source.trim().length() > 64 ? source.trim().substring(0, 64) : source.trim());
        }
        subscriber.setUnsubscribedAt(null);
        subscriber.setConfirmationSentAt(now);
        subscribers.save(subscriber);
        sendConfirmation(subscriber);
        return Outcome.CONFIRMATION_SENT;
    }

    @Transactional
    public Optional<Subscriber> confirm(String token) {
        return subscribers.findByToken(token == null ? "" : token.trim()).map(subscriber -> {
            if (subscriber.getStatus() != SubscriberStatus.ACTIVE) {
                subscriber.setStatus(SubscriberStatus.ACTIVE);
                subscriber.setConfirmedAt(Instant.now());
                subscriber.setUnsubscribedAt(null);
            }
            return subscribers.save(subscriber);
        });
    }

    @Transactional
    public Optional<Subscriber> unsubscribe(String token) {
        return subscribers.findByToken(token == null ? "" : token.trim()).map(subscriber -> {
            if (subscriber.getStatus() != SubscriberStatus.UNSUBSCRIBED) {
                subscriber.setStatus(SubscriberStatus.UNSUBSCRIBED);
                subscriber.setUnsubscribedAt(Instant.now());
            }
            return subscribers.save(subscriber);
        });
    }

    boolean allowSignup(String clientKey) {
        Instant cutoff = Instant.now().minus(Duration.ofHours(1));
        Deque<Instant> times = signupsByIp.computeIfAbsent(clientKey, key -> new ArrayDeque<>());
        synchronized (times) {
            while (!times.isEmpty() && times.peekFirst().isBefore(cutoff)) {
                times.pollFirst();
            }
            if (times.size() >= MAX_SIGNUPS_PER_HOUR) {
                return false;
            }
            times.addLast(Instant.now());
            return true;
        }
    }

    private void sendConfirmation(Subscriber subscriber) {
        String link = baseUrl + "/newsletter/confirm?token=" + subscriber.getToken()
                + ("ko".equals(subscriber.getLocale()) ? "&hl=ko" : "");
        boolean ko = "ko".equals(subscriber.getLocale());
        String subject = ko ? "DealStoker 뉴스레터 구독을 확인해 주세요" : "Confirm your DealStoker newsletter subscription";
        String intro = ko
                ? "DealStoker 주간 뉴스레터 구독을 신청해 주셔서 감사합니다. 아래 버튼을 눌러 구독을 완료해 주세요."
                : "Thanks for signing up for the DealStoker weekly newsletter. Tap the button below to confirm.";
        String button = ko ? "구독 확인하기" : "Confirm subscription";
        String ignore = ko
                ? "직접 신청하지 않으셨다면 이 메일을 무시하세요. 확인하지 않으면 메일이 더 가지 않습니다."
                : "If you didn't sign up, just ignore this email; you won't hear from us again.";
        String html = """
                <!doctype html><html><body style="margin:0;background:#f3f3f4;font-family:Arial,Helvetica,sans-serif;color:#1c1c1c">
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
                <table role="presentation" width="100%%" style="max-width:520px;background:#ffffff;border-radius:10px" cellpadding="0" cellspacing="0">
                <tr><td style="padding:28px 28px 8px;font-size:22px;font-weight:800;letter-spacing:-0.5px">
                <span style="color:#eb1c24">&#9632;</span> DealStoker</td></tr>
                <tr><td style="padding:8px 28px;font-size:15px;line-height:1.6">%s</td></tr>
                <tr><td style="padding:16px 28px"><a href="%s" style="display:inline-block;background:#eb1c24;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px">%s</a></td></tr>
                <tr><td style="padding:8px 28px 28px;font-size:13px;color:#5f6166;line-height:1.5">%s</td></tr>
                </table></td></tr></table></body></html>
                """.formatted(HtmlUtils.htmlEscape(intro), HtmlUtils.htmlEscape(link), HtmlUtils.htmlEscape(button),
                HtmlUtils.htmlEscape(ignore));
        String text = intro + "\n\n" + link + "\n\n" + ignore + "\n";
        try {
            emailSender.send(new EmailSender.Email(subscriber.getEmail(), subject, html, text, Map.of()));
        } catch (IllegalStateException ex) {
            // Keep the PENDING row; the admin screen shows that email isn't configured.
            log.warn("Could not send confirmation email: {}", ex.getMessage());
        }
    }
}
