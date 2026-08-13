package com.dealstoker.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "dealstoker")
public record DealStokerProperties(
        String appBaseUrl,
        Amazon amazon,
        Admin admin,
        Cors cors
) {
    public record Amazon(String marketplace, String partnerTag) {
        public boolean hasPartnerTag() {
            return partnerTag != null && !partnerTag.isBlank();
        }
    }

    public record Admin(String username, String password) {}

    public record Cors(String allowedOrigins) {}
}
