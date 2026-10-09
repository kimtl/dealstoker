package com.dealstoker.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Sends email through Resend's HTTP API (https://resend.com). HTTP works on every Railway plan,
 * unlike outbound SMTP. Without RESEND_API_KEY and NEWSLETTER_FROM nothing is sent.
 */
@Service
public class EmailSender {

    private static final Logger log = LoggerFactory.getLogger(EmailSender.class);

    public record Email(String to, String subject, String html, String text, Map<String, String> headers) {}

    private final String apiKey;
    private final String from;
    private final String baseUrl;
    private final RestClient restClient;

    public EmailSender(
            @Value("${dealstoker.newsletter.resend-api-key:}") String apiKey,
            @Value("${dealstoker.newsletter.from:}") String from,
            @Value("${dealstoker.newsletter.resend-base-url:https://api.resend.com}") String baseUrl
    ) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.from = from == null ? "" : from.trim();
        this.baseUrl = baseUrl.replaceAll("/$", "");
        this.restClient = AiRestClients.create();
    }

    public boolean isConfigured() {
        return !apiKey.isBlank() && !from.isBlank();
    }

    public String from() {
        return from;
    }

    /** Sends one email; throws IllegalStateException with a readable reason on failure. */
    public void send(Email email) {
        if (!isConfigured()) {
            throw new IllegalStateException("Email is not configured. Set RESEND_API_KEY and NEWSLETTER_FROM.");
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("from", from);
        body.put("to", List.of(email.to()));
        body.put("subject", email.subject());
        body.put("html", email.html());
        if (email.text() != null) {
            body.put("text", email.text());
        }
        if (email.headers() != null && !email.headers().isEmpty()) {
            body.put("headers", email.headers());
        }
        try {
            restClient.post()
                    .uri(baseUrl + "/emails")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + apiKey)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            log.warn("Resend rejected email status={}: {}", ex.getStatusCode().value(), ex.getResponseBodyAsString());
            throw new IllegalStateException("Email provider rejected the message (" + ex.getStatusCode().value() + ")");
        } catch (RuntimeException ex) {
            log.warn("Email send failed: {}", ex.toString());
            throw new IllegalStateException("Email send failed: " + ex.getMessage());
        }
    }
}
