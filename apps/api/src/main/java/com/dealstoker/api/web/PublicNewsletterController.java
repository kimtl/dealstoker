package com.dealstoker.api.web;

import com.dealstoker.api.service.SubscriptionService;
import com.dealstoker.api.util.IpHasher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.json.JsonMapper;

import java.util.Map;

/** Newsletter sign-up, confirmation and unsubscribe (no login). */
@RestController
@RequestMapping("/api/v1/newsletter")
public class PublicNewsletterController {

    public record SubscribeRequest(String email, String locale, String source, String website) {}

    public record TokenRequest(String token) {}

    private static final JsonMapper MAPPER = JsonMapper.builder().build();

    private final SubscriptionService subscriptionService;
    private final IpHasher ipHasher;

    public PublicNewsletterController(SubscriptionService subscriptionService, IpHasher ipHasher) {
        this.subscriptionService = subscriptionService;
        this.ipHasher = ipHasher;
    }

    /**
     * Always answers the same way for a valid address (whether new, pending or already active), so
     * the form can't reveal who is subscribed. "website" is a honeypot field humans never fill.
     */
    @PostMapping("/subscribe")
    public ResponseEntity<Map<String, String>> subscribe(
            @RequestBody SubscribeRequest request,
            HttpServletRequest http
    ) {
        if (request.website() == null || request.website().isBlank()) {
            subscriptionService.subscribe(request.email(), request.locale(), request.source(),
                    ipHasher.hashClientIp(http));
        }
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(Map.of("status", "check-inbox"));
    }

    @PostMapping("/confirm")
    public ResponseEntity<Map<String, String>> confirm(@RequestBody TokenRequest request) {
        return subscriptionService.confirm(request.token())
                .map(s -> ResponseEntity.ok(Map.of("status", "confirmed", "locale", s.getLocale())))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("status", "invalid")));
    }

    /**
     * Accepts the token as JSON ({"token": ...}) from the site, or as ?token= for RFC 8058
     * one-click unsubscribe POSTs sent by mail apps.
     */
    @PostMapping("/unsubscribe")
    public ResponseEntity<Map<String, String>> unsubscribe(
            @RequestParam(value = "token", required = false) String tokenParam,
            @RequestBody(required = false) String body
    ) {
        String token = tokenParam;
        if ((token == null || token.isBlank()) && body != null && body.trim().startsWith("{")) {
            try {
                token = MAPPER.readTree(body).path("token").asString(null);
            } catch (RuntimeException ignored) {
                token = null;
            }
        }
        return subscriptionService.unsubscribe(token)
                .map(s -> ResponseEntity.ok(Map.of("status", "unsubscribed")))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("status", "invalid")));
    }
}
