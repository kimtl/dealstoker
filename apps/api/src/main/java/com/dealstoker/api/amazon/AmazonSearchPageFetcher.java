package com.dealstoker.api.amazon;

import org.jsoup.Connection;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Crawls Amazon keyword search result pages (no PA-API).
 */
@Component
public class AmazonSearchPageFetcher {

    private static final Logger log = LoggerFactory.getLogger(AmazonSearchPageFetcher.class);

    private static final Pattern PRICE = Pattern.compile("([0-9]+(?:\\.[0-9]{1,2})?)");
    private static final Pattern RATING = Pattern.compile("([0-9]+(?:\\.[0-9]+)?)\\s*out of\\s*5", Pattern.CASE_INSENSITIVE);
    private static final Pattern RATINGS_COUNT = Pattern.compile("([0-9,]+)\\s+ratings?", Pattern.CASE_INSENSITIVE);
    private static final Pattern ASIN = Pattern.compile("^[A-Z0-9]{10}$");
    private static final Pattern LABEL_LIST_PRICE =
            Pattern.compile(
                    "(?i)(?:list\\s*price|was|typical\\s*price|compare\\s*at|regular\\s*price)\\s*:?\\s*\\$?([0-9]+(?:,[0-9]{3})*(?:\\.[0-9]{2})?)"
            );
    private static final Pattern REFERENCE_PRICE_LABEL =
            Pattern.compile("(?i)\\b(?:typical\\s*price|list\\s*price|compare\\s*at|regular\\s*price|was)\\b");

    public record SearchHit(
            String asin,
            String title,
            String imageUrl,
            String productUrl,
            BigDecimal priceAmount,
            BigDecimal listPrice,
            BigDecimal discountPercent,
            BigDecimal rating,
            Integer reviewCount,
            String keyword,
            boolean sponsored
    ) {}

    public record SearchPage(
            List<SearchHit> hits,
            boolean fetched,
            String note
    ) {}

    public SearchPage search(String keyword, int limit) {
        String cleaned = keyword == null ? "" : keyword.trim();
        if (cleaned.isBlank()) {
            return new SearchPage(List.of(), false, "Empty keyword");
        }
        int cap = Math.max(1, Math.min(limit, 48));
        String encoded = URLEncoder.encode(cleaned, StandardCharsets.UTF_8);
        List<String> urls = List.of(
                "https://www.amazon.com/s?k=" + encoded,
                "https://www.amazon.com/gp/aw/s?k=" + encoded,
                "https://www.amazon.com/s?k=" + encoded + "&ref=nb_sb_noss"
        );

        String lastError = null;
        for (String ua : AmazonCrawlSupport.USER_AGENTS) {
            for (String url : urls) {
                try {
                    Connection.Response response = AmazonCrawlSupport.connect(url, ua).execute();
                    int status = response.statusCode();
                    String body = response.body() == null ? "" : response.body();
                    if (status >= 400) {
                        lastError = "HTTP " + status + " for " + url;
                        continue;
                    }
                    if (AmazonCrawlSupport.looksBlocked(body)) {
                        lastError = "Amazon bot-check / CAPTCHA for search";
                        log.info("Amazon blocked search keyword={} ua={} len={}", cleaned, AmazonCrawlSupport.uaFamily(ua), body.length());
                        continue;
                    }
                    List<SearchHit> parsed = parseHtml(body, cleaned, cap);
                    if (!parsed.isEmpty()) {
                        return new SearchPage(
                                parsed,
                                true,
                                "Crawled Amazon search (" + AmazonCrawlSupport.uaFamily(ua) + ") for \""
                                        + cleaned + "\": " + parsed.size() + " products."
                        );
                    }
                    lastError = "Search page loaded but no usable product cards (" + body.length() + " bytes)";
                } catch (Exception ex) {
                    lastError = ex.getMessage();
                    log.warn("Amazon search failed keyword={} url={}: {}", cleaned, url, ex.toString());
                }
            }
        }
        return new SearchPage(
                List.of(),
                false,
                "Could not crawl Amazon search for \"" + cleaned + "\""
                        + (lastError == null ? "." : ": " + lastError)
        );
    }

    List<SearchHit> parseHtml(String html, String keyword, int limit) {
        Document doc = org.jsoup.Jsoup.parse(html);
        Map<String, SearchHit> byAsin = new LinkedHashMap<>();

        Elements cards = doc.select(
                "div[data-component-type=s-search-result][data-asin], div[data-asin]"
        );
        for (Element card : cards) {
            if (byAsin.size() >= limit) {
                break;
            }
            String asin = card.attr("data-asin");
            if (asin == null) {
                continue;
            }
            asin = asin.trim().toUpperCase(Locale.ROOT);
            if (!ASIN.matcher(asin).matches() || byAsin.containsKey(asin)) {
                continue;
            }
            boolean sponsored = isSponsored(card);
            String title = firstNonBlank(
                    text(card, "h2 a span"),
                    text(card, "h2 span"),
                    text(card, "h2 a"),
                    text(card, ".a-link-normal.s-line-clamp-2"),
                    text(card, ".a-text-normal")
            );
            if (title == null || title.length() < 4) {
                continue;
            }
            String href = firstNonBlank(
                    attr(card, "h2 a", "href"),
                    attr(card, "a.a-link-normal", "href")
            );
            String productUrl = absoluteAmazonUrl(href, asin);
            String imageUrl = firstNonBlank(
                    attr(card, "img.s-image", "src"),
                    attr(card, "img[data-image-latency]", "src"),
                    attr(card, "img", "src")
            );

            BigDecimal price = firstPrice(
                    text(card, "span.a-price:not(.a-text-price) > span.a-offscreen"),
                    text(card, "span.a-price:not(.a-text-price) span.a-offscreen"),
                    text(card, "span.a-price > span.a-offscreen"),
                    text(card, ".a-price .a-offscreen"),
                    composePriceFromWholeFraction(card.selectFirst("span.a-price:not(.a-text-price)"))
            );
            BigDecimal listPrice = extractTypicalOrReferenceFromCard(card);
            if (listPrice == null) {
                listPrice = firstPrice(
                        text(card, "span.a-price.a-text-price > span.a-offscreen"),
                        text(card, "span[data-a-strike=true] .a-offscreen"),
                        text(card, ".a-text-price .a-offscreen"),
                        composePriceFromWholeFraction(card.selectFirst("span.a-price.a-text-price"))
                );
            }
            if (listPrice != null && price != null && listPrice.compareTo(price) <= 0) {
                listPrice = null;
            }
            BigDecimal discount = discountPercent(price, listPrice);

            BigDecimal rating = parseRating(firstNonBlank(
                    text(card, "span.a-icon-alt"),
                    text(card, "i.a-icon-star-small span.a-icon-alt"),
                    attr(card, "span[aria-label*=out of 5]", "aria-label")
            ));
            Integer reviewCount = parseInt(firstNonBlank(
                    text(card, "span[aria-label$=ratings]"),
                    attr(card, "span[aria-label$=ratings]", "aria-label"),
                    text(card, "a[href*='#customerReviews'] span"),
                    text(card, ".s-underline-text")
            ));

            byAsin.put(asin, new SearchHit(
                    asin,
                    title,
                    imageUrl,
                    productUrl,
                    price,
                    listPrice,
                    discount,
                    rating,
                    reviewCount,
                    keyword,
                    sponsored
            ));
        }
        return new ArrayList<>(byAsin.values());
    }

    private static String composePriceFromWholeFraction(Element priceRoot) {
        if (priceRoot == null) {
            return null;
        }
        Element whole = priceRoot.selectFirst(".a-price-whole");
        Element fraction = priceRoot.selectFirst(".a-price-fraction");
        if (whole == null) {
            return null;
        }
        String wholeText = normalizeSpace(whole.text());
        if (wholeText == null) {
            return null;
        }
        wholeText = wholeText.replace(",", "").replace(".", "");
        String fractionText = fraction == null ? "00" : normalizeSpace(fraction.text());
        if (fractionText == null || fractionText.isBlank()) {
            fractionText = "00";
        }
        fractionText = fractionText.replaceAll("[^0-9]", "");
        if (fractionText.isBlank()) {
            fractionText = "00";
        }
        if (fractionText.length() == 1) {
            fractionText = fractionText + "0";
        }
        if (fractionText.length() > 2) {
            fractionText = fractionText.substring(0, 2);
        }
        return "$" + wholeText + "." + fractionText;
    }

    /** Treat Amazon "Typical price" (and similar) labels as the list/normal price. */
    private static BigDecimal extractTypicalOrReferenceFromCard(Element card) {
        BigDecimal fromBasis = firstPrice(
                text(card, ".basisPrice .a-offscreen"),
                text(card, "[class*=basisPrice] .a-offscreen"),
                composePriceFromWholeFraction(card.selectFirst(".basisPrice .a-price, [class*=basisPrice] .a-price"))
        );
        if (fromBasis != null) {
            return fromBasis;
        }
        for (Element el : card.select("span, div, td, li")) {
            String raw = normalizeSpace(el.text());
            if (raw == null || raw.length() > 100) {
                continue;
            }
            if (!REFERENCE_PRICE_LABEL.matcher(raw).find()) {
                continue;
            }
            Matcher labeled = LABEL_LIST_PRICE.matcher(raw);
            if (labeled.find()) {
                return parseMoney(labeled.group(1));
            }
            BigDecimal nested = firstPrice(
                    text(el, ".a-price.a-text-price .a-offscreen"),
                    text(el, ".a-offscreen"),
                    composePriceFromWholeFraction(el.selectFirst(".a-price.a-text-price, .a-price"))
            );
            if (nested != null) {
                return nested;
            }
            Element sibling = el.nextElementSibling();
            if (sibling != null) {
                BigDecimal fromSibling = firstPrice(
                        text(sibling, ".a-offscreen"),
                        composePriceFromWholeFraction(sibling.selectFirst(".a-price")),
                        normalizeSpace(sibling.text())
                );
                if (fromSibling != null) {
                    return fromSibling;
                }
            }
        }
        Matcher m = LABEL_LIST_PRICE.matcher(card.text() == null ? "" : card.text());
        if (m.find()) {
            return parseMoney(m.group(1));
        }
        return null;
    }

    private static boolean isSponsored(Element card) {
        String text = card.text().toLowerCase(Locale.ROOT);
        if (text.contains("sponsored")) {
            return true;
        }
        return card.selectFirst(".puis-sponsored-label-text, .s-sponsored-label-text, [data-component-type=sp-sponsored-result]") != null;
    }

    private static String absoluteAmazonUrl(String href, String asin) {
        if (href != null && !href.isBlank()) {
            if (href.startsWith("http")) {
                return href.split("\\?")[0];
            }
            if (href.startsWith("/")) {
                return "https://www.amazon.com" + href.split("\\?")[0];
            }
        }
        return AmazonAsinParser.canonicalProductUrl(asin);
    }

    private static BigDecimal discountPercent(BigDecimal price, BigDecimal listPrice) {
        if (price == null || listPrice == null || listPrice.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        if (listPrice.compareTo(price) <= 0) {
            return null;
        }
        return listPrice.subtract(price)
                .multiply(BigDecimal.valueOf(100))
                .divide(listPrice, 1, RoundingMode.HALF_UP);
    }

    private static String text(Element root, String css) {
        Element el = root.selectFirst(css);
        return el == null ? null : normalizeSpace(el.text());
    }

    private static String attr(Element root, String css, String name) {
        Element el = root.selectFirst(css);
        if (el == null) {
            return null;
        }
        String value = el.attr(name);
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    private static String normalizeSpace(String value) {
        if (value == null) {
            return null;
        }
        String t = value.replace('\u00a0', ' ').replaceAll("\\s+", " ").trim();
        return t.isEmpty() ? null : t;
    }

    private static BigDecimal firstPrice(String... values) {
        for (String value : values) {
            BigDecimal parsed = parseMoney(value);
            if (parsed != null) {
                return parsed;
            }
        }
        return null;
    }

    private static BigDecimal parseMoney(String raw) {
        if (raw == null) {
            return null;
        }
        Matcher m = PRICE.matcher(raw.replace(",", ""));
        if (!m.find()) {
            return null;
        }
        try {
            return new BigDecimal(m.group(1));
        } catch (Exception ignored) {
            return null;
        }
    }

    private static BigDecimal parseRating(String raw) {
        if (raw == null) {
            return null;
        }
        Matcher m = RATING.matcher(raw);
        if (!m.find()) {
            m = Pattern.compile("([0-9]+(?:\\.[0-9]+)?)").matcher(raw);
            if (!m.find()) {
                return null;
            }
        }
        try {
            BigDecimal value = new BigDecimal(m.group(1));
            if (value.compareTo(BigDecimal.ZERO) > 0 && value.compareTo(BigDecimal.valueOf(5)) <= 0) {
                return value;
            }
        } catch (Exception ignored) {
            return null;
        }
        return null;
    }

    private static Integer parseInt(String raw) {
        if (raw == null) {
            return null;
        }
        Matcher count = RATINGS_COUNT.matcher(raw);
        String digits = count.find() ? count.group(1) : raw;
        digits = digits.replaceAll("[^0-9]", "");
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
