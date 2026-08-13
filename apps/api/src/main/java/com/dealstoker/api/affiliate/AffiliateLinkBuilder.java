package com.dealstoker.api.affiliate;

import com.dealstoker.api.config.DealStokerProperties;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class AffiliateLinkBuilder {

    private final DealStokerProperties properties;

    public AffiliateLinkBuilder(DealStokerProperties properties) {
        this.properties = properties;
    }

    public String buildOutboundUrl(String detailPageUrl) {
        if (detailPageUrl == null || detailPageUrl.isBlank()) {
            throw new IllegalArgumentException("detailPageUrl is required");
        }
        String tag = properties.amazon().partnerTag();
        if (tag == null || tag.isBlank()) {
            return detailPageUrl;
        }
        try {
            URI uri = URI.create(detailPageUrl);
            String query = uri.getQuery();
            String encodedTag = URLEncoder.encode(tag.trim(), StandardCharsets.UTF_8);
            if (query == null || query.isBlank()) {
                return detailPageUrl + (detailPageUrl.contains("?") ? "&" : "?") + "tag=" + encodedTag;
            }
            if (query.matches("(?i).*(^|&)tag=.*")) {
                String replaced = query.replaceAll("(?i)(^|&)tag=[^&]*", "$1tag=" + encodedTag);
                return new URI(uri.getScheme(), uri.getAuthority(), uri.getPath(), replaced, uri.getFragment()).toString();
            }
            return new URI(
                    uri.getScheme(),
                    uri.getAuthority(),
                    uri.getPath(),
                    query + "&tag=" + encodedTag,
                    uri.getFragment()
            ).toString();
        } catch (Exception ex) {
            return detailPageUrl + (detailPageUrl.contains("?") ? "&" : "?") + "tag=" + tag.trim();
        }
    }
}
