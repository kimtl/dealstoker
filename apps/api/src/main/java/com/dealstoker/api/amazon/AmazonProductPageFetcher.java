package com.dealstoker.api.amazon;

import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Crawls Amazon product detail pages (no PA-API).
 * Uses Jsoup (handles gzip) and prefers mobile user-agents because
 * desktop often returns CAPTCHA from datacenter IPs.
 */
@Component
public class AmazonProductPageFetcher {

    private static final Logger log = LoggerFactory.getLogger(AmazonProductPageFetcher.class);

    private static final Pattern PRICE = Pattern.compile("([0-9]+(?:\\.[0-9]{1,2})?)");
    private static final Pattern RATING = Pattern.compile("([0-9]+(?:\\.[0-9]+)?)\\s*out of\\s*5", Pattern.CASE_INSENSITIVE);
    private static final Pattern RATINGS_COUNT = Pattern.compile("([0-9,]+)\\s+ratings?", Pattern.CASE_INSENSITIVE);
    private static final Pattern LANDING_IMAGE_JSON =
            Pattern.compile("\"landingImageUrl\"\\s*:\\s*\"(https:[^\"]+)\"");
    private static final Pattern HIRES_JSON =
            Pattern.compile("\"(?:hiRes|large|mainUrl|landingImageUrl)\"\\s*:\\s*\"(https:[^\"]*media-amazon[^\"]+)\"");
    private static final Pattern IMG_SRC =
            Pattern.compile("https://[^\"'\\s]+media-amazon\\.com/images/I/[A-Za-z0-9+,_%-]+\\.(?:jpg|jpeg|png)");

    private static final List<String> USER_AGENTS = List.of(
            "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    );

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
        List<String> urls = candidateUrls(asin, pageUrl);
        String lastError = null;

        for (String ua : USER_AGENTS) {
            for (String url : urls) {
                try {
                    Connection.Response response = Jsoup.connect(url)
                            .userAgent(ua)
                            .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
                            .header("Accept-Language", "en-US,en;q=0.9")
                            .header("Cache-Control", "no-cache")
                            .header("Pragma", "no-cache")
                            .header("Upgrade-Insecure-Requests", "1")
                            .header("sec-ch-ua", "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\"")
                            .header("sec-ch-ua-mobile", ua.contains("Android") || ua.contains("iPhone") ? "?1" : "?0")
                            .header("sec-ch-ua-platform", ua.contains("Android") ? "\"Android\"" : (ua.contains("iPhone") ? "\"iOS\"" : "\"Windows\""))
                            .header("Sec-Fetch-Dest", "document")
                            .header("Sec-Fetch-Mode", "navigate")
                            .header("Sec-Fetch-Site", "none")
                            .header("Sec-Fetch-User", "?1")
                            .timeout(20_000)
                            .followRedirects(true)
                            .maxBodySize(0)
                            .ignoreHttpErrors(true)
                            .execute();

                    int status = response.statusCode();
                    String body = response.body() == null ? "" : response.body();
                    if (status >= 400) {
                        lastError = "HTTP " + status + " for " + url;
                        continue;
                    }
                    if (looksBlocked(body)) {
                        lastError = "Amazon bot-check / CAPTCHA for " + url;
                        log.info("Amazon blocked ASIN={} url={} ua={} len={}", asin, url, uaFamily(ua), body.length());
                        continue;
                    }

                    ScrapedProduct parsed = parseHtml(body);
                    if (isUseful(parsed)) {
                        return withNote(
                                parsed,
                                true,
                                "Crawled Amazon detail page (" + uaFamily(ua) + "). " + summarize(parsed)
                        );
                    }
                    lastError = "Page loaded (" + body.length() + " bytes) but product fields were incomplete";
                    log.info(
                            "Amazon incomplete parse ASIN={} url={} ua={} len={} title={}",
                            asin, url, uaFamily(ua), body.length(), parsed.title()
                    );
                } catch (Exception ex) {
                    lastError = ex.getMessage();
                    log.warn("Amazon crawl failed ASIN={} url={}: {}", asin, url, ex.toString());
                }
            }
        }

        return empty(false, "Could not crawl a usable Amazon detail page"
                + (lastError == null ? "." : ": " + lastError)
                + " Fill fields manually or retry.");
    }

    private static List<String> candidateUrls(String asin, String pageUrl) {
        LinkedHashSet<String> urls = new LinkedHashSet<>();
        String cleanAsin = asin.toUpperCase(Locale.ROOT);
        urls.add("https://www.amazon.com/dp/" + cleanAsin);
        urls.add("https://www.amazon.com/gp/aw/d/" + cleanAsin);
        urls.add("https://www.amazon.com/dp/" + cleanAsin + "?th=1&psc=1");
        if (pageUrl != null && !pageUrl.isBlank()) {
            urls.add(pageUrl.trim());
        }
        return List.copyOf(urls);
    }

    ScrapedProduct parseHtml(String html) {
        Document doc = Jsoup.parse(html);

        String title = cleanTitle(firstNonBlank(
                text(doc, "#productTitle"),
                text(doc, "#title"),
                text(doc, "#title_feature_div #title"),
                text(doc, "#title_feature_div"),
                text(doc, "#titleSection"),
                meta(doc, "og:title"),
                metaName(doc, "title"),
                meta(doc, "twitter:title"),
                doc.title()
        ));

        String imageUrl = preferLargeImage(firstNonBlank(
                jsonFirst(html, LANDING_IMAGE_JSON),
                jsonFirst(html, HIRES_JSON),
                attr(doc, "img#landingImage", "data-old-hires"),
                attr(doc, "img#landingImage", "src"),
                attr(doc, "#imgTagWrapperId img", "data-old-hires"),
                attr(doc, "#imgTagWrapperId img", "src"),
                attr(doc, "img[data-a-image-name=landingImage]", "src"),
                largestDynamicImage(attr(doc, "img[data-a-dynamic-image]", "data-a-dynamic-image")),
                meta(doc, "og:image"),
                meta(doc, "twitter:image"),
                firstProductImageFromHtml(html)
        ));

        List<String> features = extractFeatures(doc);
        String overview = extractOverview(doc);
        String productDescription = firstNonBlank(
                text(doc, "#productDescription p"),
                text(doc, "#productDescription"),
                text(doc, "#productDescription_feature_div")
        );

        String description = firstNonBlank(
                joinFeatures(features),
                overview,
                productDescription,
                meta(doc, "og:description"),
                metaName(doc, "description")
        );
        if (description != null && description.length() > 4000) {
            description = description.substring(0, 4000);
        }

        String brand = cleanBrand(firstNonBlank(
                text(doc, "#bylineInfo"),
                text(doc, "a#bylineInfo"),
                text(doc, "#brand"),
                meta(doc, "product:brand"),
                overviewBrand(overview)
        ));

        BigDecimal price = firstPrice(
                text(doc, "#corePrice_feature_div .a-price .a-offscreen"),
                text(doc, "#corePriceDisplay_desktop_feature_div .a-price .a-offscreen"),
                text(doc, "#corePrice_mobile_feature_div span.a-offscreen"),
                text(doc, "#corePrice_mobile span.a-offscreen"),
                text(doc, "#apex_desktop .a-price .a-offscreen"),
                text(doc, "#priceblock_ourprice"),
                text(doc, "#priceblock_dealprice"),
                text(doc, "#price_inside_buybox"),
                firstOffscreenPrice(doc),
                meta(doc, "product:price:amount")
        );

        BigDecimal listPrice = firstPrice(
                text(doc, "#corePrice_feature_div .a-text-price .a-offscreen"),
                text(doc, "#corePriceDisplay_desktop_feature_div .a-text-price .a-offscreen"),
                text(doc, "#corePrice_mobile_feature_div .a-text-price .a-offscreen"),
                text(doc, ".a-price.a-text-price .a-offscreen"),
                text(doc, "#listPrice"),
                text(doc, "#priceblock_listprice")
        );
        if (listPrice != null && price != null && listPrice.compareTo(price) <= 0) {
            listPrice = null;
        }

        BigDecimal rating = parseRating(firstNonBlank(
                text(doc, "span[data-hook=rating-out-of-text]"),
                text(doc, "#acrPopover span.a-size-small"),
                text(doc, "i.a-icon-star span.a-icon-alt"),
                text(doc, "span.a-icon-alt"),
                findRegex(html, RATING)
        ));

        Integer reviewCount = parseInt(firstNonBlank(
                text(doc, "#acrCustomerReviewText"),
                text(doc, "span[data-hook=total-review-count]"),
                findRegex(html, RATINGS_COUNT)
        ));

        boolean hasSignal = title != null && (imageUrl != null || price != null || !features.isEmpty());
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
                null
        );
    }

    private static List<String> extractFeatures(Document doc) {
        LinkedHashSet<String> features = new LinkedHashSet<>();
        Elements bullets = doc.select(
                "#feature-bullets li span.a-list-item, #featurebullets_feature_div li span.a-list-item"
        );
        for (Element el : bullets) {
            String t = normalizeSpace(el.text());
            if (t == null) {
                continue;
            }
            String lower = t.toLowerCase(Locale.ROOT);
            if (lower.contains("ensure yourself") || lower.contains("click to see") || t.length() < 8) {
                continue;
            }
            features.add(t);
            if (features.size() >= 12) {
                break;
            }
        }
        return new ArrayList<>(features);
    }

    private static String extractOverview(Document doc) {
        Elements rows = doc.select(
                "#productOverview_feature_div table tr, #productDetails_techSpec_section_1 tr, #detailBullets_feature_div li"
        );
        if (rows.isEmpty()) {
            return null;
        }
        List<String> parts = new ArrayList<>();
        for (Element row : rows) {
            String text = normalizeSpace(row.text());
            if (text != null && text.length() > 3 && parts.size() < 12) {
                parts.add(text);
            }
        }
        return parts.isEmpty() ? null : String.join(" · ", parts);
    }

    private static String overviewBrand(String overview) {
        if (overview == null) {
            return null;
        }
        Matcher m = Pattern.compile("(?i)\\bBrand\\s*[|:·]\\s*([^·|]{2,60})").matcher(overview);
        if (m.find()) {
            return m.group(1).trim();
        }
        return null;
    }

    private static String firstOffscreenPrice(Document doc) {
        Elements prices = doc.select("span.a-price > span.a-offscreen, span.a-price span.a-offscreen");
        for (Element el : prices) {
            String text = normalizeSpace(el.text());
            if (text != null && text.contains("$")) {
                return text;
            }
        }
        return null;
    }

    private static String largestDynamicImage(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String decoded = raw;
        try {
            decoded = URLDecoder.decode(raw.replace("&quot;", "\""), StandardCharsets.UTF_8);
        } catch (Exception ignored) {
            decoded = raw.replace("&quot;", "\"");
        }
        Matcher m = Pattern.compile("\"(https:[^\"]+)\":\\[([0-9]+),([0-9]+)]").matcher(decoded);
        String best = null;
        int bestArea = -1;
        while (m.find()) {
            int area = Integer.parseInt(m.group(2)) * Integer.parseInt(m.group(3));
            if (area > bestArea) {
                bestArea = area;
                best = m.group(1);
            }
        }
        return best;
    }

    private static String firstProductImageFromHtml(String html) {
        Matcher m = IMG_SRC.matcher(html);
        while (m.find()) {
            String url = m.group();
            if (url.contains("_AC_UL") && url.contains("SR200")) {
                continue;
            }
            return url;
        }
        return null;
    }

    private static String preferLargeImage(String url) {
        if (url == null) {
            return null;
        }
        return url
                .replaceAll("\\._AC_UF\\d+,\\d+_QL\\d+_\\.", "._AC_SL1500_.")
                .replaceAll("\\._AC_UL\\d+_SR\\d+,\\d+_\\.", "._AC_SL1500_.")
                .replaceAll("\\._SS\\d+_\\.", "._AC_SL1500_.");
    }

    private static boolean isUseful(ScrapedProduct scraped) {
        if (scraped == null || scraped.title() == null || scraped.title().isBlank()) {
            return false;
        }
        int score = 0;
        if (scraped.imageUrl() != null) score += 2;
        if (scraped.priceAmount() != null) score += 2;
        if (scraped.features() != null && !scraped.features().isEmpty()) score += 2;
        if (scraped.description() != null && scraped.description().length() > 40) score += 1;
        if (scraped.brand() != null) score += 1;
        return score >= 2;
    }

    private static String summarize(ScrapedProduct scraped) {
        List<String> bits = new ArrayList<>();
        if (scraped.title() != null) bits.add("title");
        if (scraped.priceAmount() != null) bits.add("price");
        if (scraped.imageUrl() != null) bits.add("image");
        if (scraped.features() != null && !scraped.features().isEmpty()) {
            bits.add(scraped.features().size() + " features");
        }
        if (scraped.rating() != null) bits.add("rating");
        return "Got: " + String.join(", ", bits) + ".";
    }

    private static ScrapedProduct withNote(ScrapedProduct scraped, boolean fetched, String note) {
        return new ScrapedProduct(
                scraped.title(),
                scraped.imageUrl(),
                scraped.description(),
                scraped.brand(),
                scraped.priceAmount(),
                scraped.listPrice(),
                scraped.rating(),
                scraped.reviewCount(),
                scraped.features(),
                fetched,
                note
        );
    }

    private static ScrapedProduct empty(boolean fetched, String note) {
        return new ScrapedProduct(null, null, null, null, null, null, null, null, List.of(), fetched, note);
    }

    private static boolean looksBlocked(String body) {
        if (body == null || body.length() < 50_000) {
            String lower = body == null ? "" : body.toLowerCase(Locale.ROOT);
            return body == null
                    || body.length() < 8_000
                    || lower.contains("api-services-support@amazon.com")
                    || lower.contains("enter the characters you see below")
                    || lower.contains("robot check")
                    || (lower.contains("captcha") && !lower.contains("producttitle") && !lower.contains("id=\"title\""));
        }
        String lower = body.toLowerCase(Locale.ROOT);
        return lower.contains("api-services-support@amazon.com")
                && lower.contains("validatecaptcha");
    }

    private static String uaFamily(String ua) {
        if (ua.contains("Android")) return "Android mobile";
        if (ua.contains("iPhone")) return "iPhone mobile";
        return "desktop";
    }

    private static String meta(Document doc, String property) {
        Element el = doc.selectFirst("meta[property=" + property + "]");
        return el == null ? null : blankToNull(el.attr("content"));
    }

    private static String metaName(Document doc, String name) {
        Element el = doc.selectFirst("meta[name=" + name + "]");
        return el == null ? null : blankToNull(el.attr("content"));
    }

    private static String text(Document doc, String css) {
        Element el = doc.selectFirst(css);
        return el == null ? null : normalizeSpace(el.text());
    }

    private static String attr(Document doc, String css, String attrName) {
        Element el = doc.selectFirst(css);
        if (el == null) {
            return null;
        }
        return blankToNull(el.attr(attrName));
    }

    private static String jsonFirst(String html, Pattern pattern) {
        Matcher m = pattern.matcher(html);
        if (m.find()) {
            return m.group(1).replace("\\u002F", "/").replace("\\/", "/");
        }
        return null;
    }

    private static String findRegex(String html, Pattern pattern) {
        Matcher m = pattern.matcher(html);
        if (m.find()) {
            return m.group(0);
        }
        return null;
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private static String normalizeSpace(String value) {
        if (value == null) {
            return null;
        }
        String t = value.replace('\u00a0', ' ').replaceAll("\\s+", " ").trim();
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

    private static String cleanTitle(String title) {
        if (title == null) {
            return null;
        }
        String cleaned = title;
        cleaned = cleaned.replaceFirst("(?i)^Amazon\\.com\\s*:\\s*", "");
        cleaned = cleaned.replaceAll("(?i)\\s*[|].*Amazon\\.com.*$", "");
        // Strip trailing " : Category" from meta titles, but keep mid-title colons.
        cleaned = cleaned.replaceAll("\\s*:\\s*[A-Za-z][A-Za-z &/]{1,40}\\s*$", "");
        return normalizeSpace(cleaned);
    }

    private static String cleanBrand(String brand) {
        if (brand == null) {
            return null;
        }
        String cleaned = brand;
        cleaned = cleaned.replaceFirst("(?i)^\\s*(visit the|brand:\\s*)", "");
        cleaned = cleaned.replaceFirst("(?i)\\s*store\\s*$", "");
        return normalizeSpace(cleaned);
    }

    private static String joinFeatures(List<String> features) {
        if (features == null || features.isEmpty()) {
            return null;
        }
        return String.join("\n", features);
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
