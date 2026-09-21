package com.dealstoker.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "dealstoker")
public record DealStokerProperties(
        String appBaseUrl,
        Amazon amazon,
        Admin admin,
        Cors cors,
        Ai ai
) {
    public record Amazon(String marketplace, String partnerTag) {
        public boolean hasPartnerTag() {
            return partnerTag != null && !partnerTag.isBlank();
        }
    }

    public record Admin(String username, String password) {}

    public record Cors(String allowedOrigins) {}

    public record Ai(String apiKey, String baseUrl, String model) {
        public boolean isConfigured() {
            return apiKey != null && !apiKey.isBlank();
        }

        public String resolvedBaseUrl() {
            if (baseUrl == null || baseUrl.isBlank()) {
                return "https://api.openai.com/v1";
            }
            return baseUrl.replaceAll("/$", "");
        }

        public String resolvedModel() {
            return model == null || model.isBlank() ? "gpt-4o-mini" : model.trim();
        }
    }
}
