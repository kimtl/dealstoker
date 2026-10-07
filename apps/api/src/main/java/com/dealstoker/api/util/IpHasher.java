package com.dealstoker.api.util;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.HexFormat;

/**
 * Keyed hash (HMAC-SHA256) of client IP addresses for analytics and click de-duplication.
 * A plain SHA-256 of an IPv4 address can be reversed by hashing all 2^32 addresses; with a
 * server-only secret that is no longer possible without the secret. Set {@code IP_HASH_SECRET}
 * in production. When it is missing, a random secret is generated per process, so hashes
 * stay private but change on every restart.
 */
@Component
public class IpHasher {

    private static final Logger log = LoggerFactory.getLogger(IpHasher.class);
    private static final String ALGORITHM = "HmacSHA256";
    static final int MIN_SECRET_LENGTH = 32;

    private final SecretKeySpec key;

    public IpHasher(@Value("${dealstoker.analytics.ip-hash-secret:}") String secret) {
        byte[] keyBytes;
        if (secret == null || secret.isBlank()) {
            keyBytes = new byte[32];
            new SecureRandom().nextBytes(keyBytes);
            log.warn("IP_HASH_SECRET is not set; using a random per-process secret. "
                    + "IP hashes will change on every restart.");
        } else {
            if (secret.trim().length() < MIN_SECRET_LENGTH) {
                log.warn("IP_HASH_SECRET is shorter than {} characters; use a longer random value.",
                        MIN_SECRET_LENGTH);
            }
            keyBytes = secret.trim().getBytes(StandardCharsets.UTF_8);
        }
        this.key = new SecretKeySpec(keyBytes, ALGORITHM);
    }

    /** Hex HMAC of the IP, or null when the IP is missing. */
    public String hash(String ip) {
        if (ip == null || ip.isBlank()) {
            return null;
        }
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            mac.init(key);
            return HexFormat.of().formatHex(mac.doFinal(ip.trim().getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException ex) {
            return null;
        }
    }

    /** Hashed client IP of the request (first X-Forwarded-For entry behind the proxy). */
    public String hashClientIp(HttpServletRequest request) {
        return hash(clientIp(request));
    }

    static String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
