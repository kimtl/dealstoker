package com.dealstoker.api.amazon;

import java.net.URI;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Extracts Amazon ASINs from common product URL shapes (no PA-API).
 */
public final class AmazonAsinParser {

    private static final Pattern ASIN = Pattern.compile("\\b([A-Z0-9]{10})\\b");
    private static final Pattern PATH_ASIN = Pattern.compile(
            "(?i)/(?:dp|gp/product|gp/aw/d|product)/([A-Z0-9]{10})(?:[/?]|$)"
    );

    private AmazonAsinParser() {}

    public static Optional<String> extract(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            return Optional.empty();
        }
        String trimmed = rawUrl.trim();
        // Bare ASIN pasted into the field
        if (trimmed.matches("(?i)^[A-Z0-9]{10}$")) {
            return Optional.of(trimmed.toUpperCase(Locale.ROOT));
        }
        try {
            URI uri = URI.create(trimmed.contains("://") ? trimmed : "https://" + trimmed);
            String path = uri.getPath() == null ? "" : uri.getPath();
            Matcher pathMatcher = PATH_ASIN.matcher(path);
            if (pathMatcher.find()) {
                return Optional.of(pathMatcher.group(1).toUpperCase(Locale.ROOT));
            }
            String query = uri.getQuery();
            if (query != null) {
                for (String part : query.split("&")) {
                    int eq = part.indexOf('=');
                    if (eq > 0) {
                        String key = part.substring(0, eq);
                        String value = part.substring(eq + 1);
                        if (key.equalsIgnoreCase("asin") || key.equalsIgnoreCase("pd_rd_i")) {
                            Matcher m = ASIN.matcher(value.toUpperCase(Locale.ROOT));
                            if (m.find()) {
                                return Optional.of(m.group(1));
                            }
                        }
                    }
                }
            }
            Matcher any = ASIN.matcher(path.toUpperCase(Locale.ROOT));
            if (any.find()) {
                return Optional.of(any.group(1));
            }
        } catch (Exception ignored) {
            Matcher fallback = ASIN.matcher(trimmed.toUpperCase(Locale.ROOT));
            if (fallback.find()) {
                return Optional.of(fallback.group(1));
            }
        }
        return Optional.empty();
    }

    public static String canonicalProductUrl(String asin) {
        return "https://www.amazon.com/dp/" + asin.toUpperCase(Locale.ROOT);
    }

    /** Best-effort title from /Some-Name/dp/ASIN paths. */
    public static Optional<String> titleHintFromUrl(String rawUrl) {
        try {
            URI uri = URI.create(rawUrl.contains("://") ? rawUrl.trim() : "https://" + rawUrl.trim());
            String path = uri.getPath();
            if (path == null || path.isBlank()) {
                return Optional.empty();
            }
            String[] parts = path.split("/");
            for (int i = 0; i < parts.length - 1; i++) {
                if ("dp".equalsIgnoreCase(parts[i + 1]) || "product".equalsIgnoreCase(parts[i + 1])) {
                    String slug = parts[i];
                    if (slug != null && !slug.isBlank() && !slug.equalsIgnoreCase("gp")) {
                        String title = slug.replace('-', ' ').replace('_', ' ').trim();
                        if (title.length() >= 3) {
                            return Optional.of(title);
                        }
                    }
                }
            }
        } catch (Exception ignored) {
            // ignore
        }
        return Optional.empty();
    }
}
