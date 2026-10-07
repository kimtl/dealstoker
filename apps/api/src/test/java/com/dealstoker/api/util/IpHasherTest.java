package com.dealstoker.api.util;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

import static org.assertj.core.api.Assertions.assertThat;

class IpHasherTest {

    private static final String SECRET = "0123456789abcdef0123456789abcdef";

    @Test
    void sameSecretGivesStableHash() {
        assertThat(new IpHasher(SECRET).hash("203.0.113.7"))
                .isEqualTo(new IpHasher(SECRET).hash("203.0.113.7"))
                .hasSize(64);
    }

    @Test
    void differentSecretGivesDifferentHash() {
        assertThat(new IpHasher(SECRET).hash("203.0.113.7"))
                .isNotEqualTo(new IpHasher(SECRET + "x").hash("203.0.113.7"));
    }

    @Test
    void hashIsNotThePlainSha256OfTheIp() throws Exception {
        String plain = HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest("203.0.113.7".getBytes(StandardCharsets.UTF_8)));
        assertThat(new IpHasher(SECRET).hash("203.0.113.7")).isNotEqualTo(plain);
    }

    @Test
    void missingSecretStillHashesConsistentlyWithinTheProcess() {
        IpHasher hasher = new IpHasher("");
        assertThat(hasher.hash("203.0.113.7")).isEqualTo(hasher.hash("203.0.113.7"));
        assertThat(hasher.hash("203.0.113.7")).isNotEqualTo(new IpHasher("").hash("203.0.113.7"));
    }

    @Test
    void blankIpGivesNull() {
        assertThat(new IpHasher(SECRET).hash(null)).isNull();
        assertThat(new IpHasher(SECRET).hash("  ")).isNull();
    }

    @Test
    void usesFirstForwardedForAddress() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.0.1");
        request.addHeader("X-Forwarded-For", "203.0.113.7, 10.0.0.1");
        IpHasher hasher = new IpHasher(SECRET);
        assertThat(hasher.hashClientIp(request)).isEqualTo(hasher.hash("203.0.113.7"));
    }
}
