package com.dealstoker.api.affiliate;

import com.dealstoker.api.amazon.AmazonAsinParser;
import com.dealstoker.api.config.DealStokerProperties;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

@Component
public class AffiliateLinkBuilder {

    public static final String DEFAULT_PARTNER_TAG = "dealstoker01-20";

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
        return buildOutboundUrl(detailPageUrl, null);
    }

    /**
     * Builds a click-out URL with the configured Associates tag.
     * Prefers a canonical amazon.com/dp/ASIN?tag=… link when the stored URL is
     * missing/broken or not a usable Amazon product URL.
     */
    public String buildOutboundUrl(String detailPageUrl, String asinHint) {
        if (detailPageUrl == null || detailPageUrl.isBlank()) {
            throw new IllegalArgumentException("detailPageUrl is required");
        }

        String tag = resolvedPartnerTag();
        Optional<String> asin = AmazonAsinParser.extract(detailPageUrl);
        if (asin.isEmpty()) {
            asin = normalizeAsin(asinHint);
        }

        URI uri = tryParse(detailPageUrl.trim());
        String host = hostOf(uri);

        // SiteStripe short links already carry attribution — leave untouched.
        if (isShortAffiliateHost(host)) {
            return detailPageUrl.trim();
        }

        // Broken / non-Amazon hosts (e.g. https://link.amazon/XXXX) → canonical tagged DP URL.
        if (asin.isPresent() && shouldCanonicalize(host, uri)) {
            return canonicalTaggedUrl(asin.get(), tag);
        }

        if (tag == null) {
            return detailPageUrl.trim();
        }

        if (isAmazonHost(host)) {
            return appendOrReplaceTag(detailPageUrl.trim(), uri, tag);
        }

        // Unknown host but we know the ASIN — still send shoppers to Amazon with our tag.
        if (asin.isPresent()) {
            return canonicalTaggedUrl(asin.get(), tag);
        }

        return appendOrReplaceTag(detailPageUrl.trim(), uri, tag);
    }

    String resolvedPartnerTag() {
        String configured = properties.amazon() == null ? null : properties.amazon().partnerTag();
        if (configured != null && !configured.isBlank()) {
            return configured.trim();
        }
        return DEFAULT_PARTNER_TAG;
    }

    private static boolean shouldCanonicalize(String host, URI uri) {
        if (host == null || host.isBlank()) {
            return true;
        }
        if (isShortAffiliateHost(host)) {
            return false;
        }
        // Malformed short hosts seen in production, e.g. link.amazon
        if (host.equals("link.amazon") || host.endsWith(".amazon") && !host.contains("amazon.")) {
            return true;
        }
        if (!isAmazonHost(host)) {
            return true;
        }
        String path = uri == null || uri.getPath() == null ? "" : uri.getPath().toLowerCase(Locale.ROOT);
        return !(path.contains("/dp/")
                || path.contains("/gp/product/")
                || path.contains("/gp/aw/d/")
                || path.contains("/product/"));
    }

    private static boolean isShortAffiliateHost(String host) {
        return host != null && AFFILIATE_SHORT_HOSTS.contains(host);
    }

    private static boolean isAmazonHost(String host) {
        if (host == null || host.isBlank()) {
            return false;
        }
        return host.equals("amazon.com")
                || host.endsWith(".amazon.com")
                || host.matches("amazon\\.[a-z.]+")
                || host.matches(".*\\.amazon\\.[a-z.]+");
    }

    private static String canonicalTaggedUrl(String asin, String tag) {
        String base = AmazonAsinParser.canonicalProductUrl(asin);
        if (tag == null || tag.isBlank()) {
            return base;
        }
        return base + "?tag=" + urlEncode(tag);
    }

    private static String appendOrReplaceTag(String detailPageUrl, URI uri, String tag) {
        String encodedTag = urlEncode(tag);
        try {
            if (uri == null) {
                return detailPageUrl + (detailPageUrl.contains("?") ? "&" : "?") + "tag=" + encodedTag;
            }
            String query = uri.getQuery();
            if (query == null || query.isBlank()) {
                return detailPageUrl + (detailPageUrl.contains("?") ? "&" : "?") + "tag=" + encodedTag;
            }
            if (query.matches("(?i).*(^|&)tag=.*")) {
                String replaced = query.replaceAll("(?i)(^|&)tag=[^&]*", "$1tag=" + encodedTag);
                if (replaced.startsWith("&")) {
                    replaced = replaced.substring(1);
                }
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

    private static Optional<String> normalizeAsin(String asinHint) {
        if (asinHint == null || asinHint.isBlank()) {
            return Optional.empty();
        }
        String cleaned = asinHint.trim().toUpperCase(Locale.ROOT);
        if (cleaned.matches("^[A-Z0-9]{10}$")) {
            return Optional.of(cleaned);
        }
        return AmazonAsinParser.extract(cleaned);
    }

    private static URI tryParse(String url) {
        try {
            return URI.create(url.contains("://") ? url : "https://" + url);
        } catch (Exception ex) {
            return null;
        }
    }

    private static String hostOf(URI uri) {
        if (uri == null || uri.getHost() == null) {
            return "";
        }
        return uri.getHost().toLowerCase(Locale.ROOT);
    }

    private static String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
