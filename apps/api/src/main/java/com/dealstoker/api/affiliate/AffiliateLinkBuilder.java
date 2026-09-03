package com.dealstoker.api.affiliate;

import com.dealstoker.api.config.DealStokerProperties;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Set;

@Component
public class AffiliateLinkBuilder {

    private static final Set<String> AFFILIATE_SHORT_HOSTS = Set.of(
            "amzn.to",
            "a.co",
            "amzn.com"
    );

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
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
            // SiteStripe short links already carry attribution — do not rewrite.
            if (AFFILIATE_SHORT_HOSTS.contains(host)) {
                return detailPageUrl;
            }
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
