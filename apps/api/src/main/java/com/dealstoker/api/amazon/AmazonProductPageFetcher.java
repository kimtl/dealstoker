package com.dealstoker.api.amazon;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Best-effort Amazon product page scrape (Open Graph / JSON-LD / common DOM).
 * Not a substitute for PA-API — Amazon may block datacenter IPs.
 */
@Component
public class AmazonProductPageFetcher {

    private static final Logger log = LoggerFactory.getLogger(AmazonProductPageFetcher.class);
    private static final Pattern PRICE = Pattern.compile("([0-9]+(?:\\.[0-9]{1,2})?)");
    private static final Pattern RATING = Pattern.compile("([0-9]+(?:\\.[0-9]+)?)");

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    public record ScrapedProduct(
            String title,
            String imageUrl,
            String description,
            String brand,
            BigDecimal priceAmount,
            BigDecimal listPrice,
            BigDecimal rating,
            Integer reviewCount,
            List<String> features,
            boolean fetched,
            String fetchNote
    ) {}

    public ScrapedProduct fetch(String asin, String pageUrl) {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(pageUrl))
                    .timeout(Duration.ofSeconds(12))
                    .header(
                            "User-Agent",
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                                    + "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
                    )
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .header("Accept-Language", "en-US,en;q=0.9")
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            String body = response.body() == null ? "" : response.body();
            if (status >= 400 || looksBlocked(body)) {
                log.info("Amazon page fetch blocked or failed for {} status={}", asin, status);
                return empty(false, "Amazon page fetch failed (HTTP " + status + "). Fill fields manually.");
            }
            return parseHtml(body);
        } catch (Exception ex) {
            log.warn("Amazon page fetch error for {}: {}", asin, ex.toString());
            return empty(false, "Could not fetch Amazon page: " + ex.getMessage());
        }
    }

    ScrapedProduct parseHtml(String html) {
        Document doc = Jsoup.parse(html);
        String title = firstNonBlank(
                meta(doc, "og:title"),
                meta(doc, "twitter:title"),
                text(doc, "#productTitle"),
                text(doc, "#title"),
                doc.title()
        );
        if (title != null) {
            title = title.replaceAll("\\s*[|:].*Amazon\\.com.*$", "").trim();
            title = title.replaceAll("\\s{2,}", " ").trim();
        }

        String imageUrl = firstNonBlank(
                meta(doc, "og:image"),
                meta(doc, "twitter:image"),
                attr(doc, "#landingImage", "src"),
                attr(doc, "#imgTagWrapperId img", "src"),
                attr(doc, "img#landingImage", "data-old-hires")
        );

        String description = firstNonBlank(
                meta(doc, "og:description"),
                meta(doc, "description"),
                text(doc, "#feature-bullets")
        );
        if (description != null && description.length() > 2000) {
            description = description.substring(0, 2000);
        }

        String brand = firstNonBlank(
                text(doc, "#bylineInfo"),
                text(doc, "a#bylineInfo"),
                meta(doc, "product:brand")
        );
        if (brand != null) {
            brand = brand.replaceFirst("(?i)^\\s*(visit the|brand:\\s*)", "").replaceFirst("(?i)\\s*store\\s*$", "").trim();
        }

        BigDecimal price = parseMoney(firstNonBlank(
                text(doc, ".a-price .a-offscreen"),
                text(doc, "#priceblock_ourprice"),
                text(doc, "#priceblock_dealprice"),
                text(doc, "#corePrice_feature_div .a-offscreen"),
                meta(doc, "product:price:amount")
        ));
        BigDecimal listPrice = parseMoney(firstNonBlank(
                text(doc, ".a-price.a-text-price .a-offscreen"),
                text(doc, "#listPrice"),
                text(doc, "#priceblock_listprice")
        ));

        BigDecimal rating = parseRating(firstNonBlank(
                attr(doc, "span[data-hook=rating-out-of-text]", "text"),
                text(doc, "span[data-hook=rating-out-of-text]"),
                attr(doc, "i.a-icon-star span.a-icon-alt", "text"),
                text(doc, "i.a-icon-star span.a-icon-alt"),
                text(doc, "#acrPopover")
        ));

        Integer reviewCount = parseInt(firstNonBlank(
                text(doc, "#acrCustomerReviewText"),
                text(doc, "span[data-hook=total-review-count]")
        ));

        List<String> features = new ArrayList<>();
        Elements bullets = doc.select("#feature-bullets li span.a-list-item");
        for (Element el : bullets) {
            String t = el.text().trim();
            if (!t.isBlank() && !t.toLowerCase().contains("ensure") && features.size() < 12) {
                features.add(t);
            }
        }

        boolean hasSignal = title != null || imageUrl != null || price != null;
        return new ScrapedProduct(
                title,
                imageUrl,
                description,
                brand,
                price,
                listPrice,
                rating,
                reviewCount,
                features,
                hasSignal,
                hasSignal
                        ? "Parsed product fields from the Amazon page (best effort)."
                        : "Amazon HTML returned but no product fields found. Fill manually."
        );
    }

    private static ScrapedProduct empty(boolean fetched, String note) {
        return new ScrapedProduct(null, null, null, null, null, null, null, null, List.of(), fetched, note);
    }

    private static boolean looksBlocked(String body) {
        String lower = body.toLowerCase();
        return lower.contains("api-services-support@amazon.com")
                || lower.contains("enter the characters you see below")
                || lower.contains("robot check")
                || (lower.contains("captcha") && lower.contains("amazon"));
    }

    private static String meta(Document doc, String property) {
        Element el = doc.selectFirst("meta[property=" + property + "], meta[name=" + property + "]");
        return el == null ? null : blankToNull(el.attr("content"));
    }

    private static String text(Document doc, String css) {
        Element el = doc.selectFirst(css);
        return el == null ? null : blankToNull(el.text());
    }

    private static String attr(Document doc, String css, String attr) {
        Element el = doc.selectFirst(css);
        if (el == null) {
            return null;
        }
        if ("text".equals(attr)) {
            return blankToNull(el.text());
        }
        return blankToNull(el.attr(attr));
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    private static BigDecimal parseMoney(String raw) {
        if (raw == null) {
            return null;
        }
        Matcher m = PRICE.matcher(raw.replace(",", ""));
        if (m.find()) {
            try {
                return new BigDecimal(m.group(1));
            } catch (Exception ignored) {
                return null;
            }
        }
        return null;
    }

    private static BigDecimal parseRating(String raw) {
        if (raw == null) {
            return null;
        }
        Matcher m = RATING.matcher(raw);
        if (m.find()) {
            try {
                BigDecimal value = new BigDecimal(m.group(1));
                if (value.compareTo(BigDecimal.ZERO) > 0 && value.compareTo(BigDecimal.valueOf(5)) <= 0) {
                    return value;
                }
            } catch (Exception ignored) {
                return null;
            }
        }
        return null;
    }

    private static Integer parseInt(String raw) {
        if (raw == null) {
            return null;
        }
        String digits = raw.replaceAll("[^0-9]", "");
        if (digits.isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(digits);
        } catch (Exception ignored) {
            return null;
        }
    }
}
