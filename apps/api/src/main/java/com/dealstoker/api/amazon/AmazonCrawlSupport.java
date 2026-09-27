package com.dealstoker.api.amazon;

import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Locale;

/**
 * Shared Amazon HTML crawl helpers (no PA-API).
 */
public final class AmazonCrawlSupport {

    private static final Logger log = LoggerFactory.getLogger(AmazonCrawlSupport.class);

    public static final List<String> USER_AGENTS = List.of(
            "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    );

    private AmazonCrawlSupport() {}

    public static Connection connect(String url, String userAgent) {
        boolean mobile = userAgent.contains("Android") || userAgent.contains("iPhone");
        return Jsoup.connect(url)
                .userAgent(userAgent)
                .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
                .header("Accept-Language", "en-US,en;q=0.9")
                .header("Cache-Control", "no-cache")
                .header("Pragma", "no-cache")
                .header("Upgrade-Insecure-Requests", "1")
                .header("sec-ch-ua", "\"Chromium\";v=\"128\", \"Not;A=Brand\";v=\"24\", \"Google Chrome\";v=\"128\"")
                .header("sec-ch-ua-mobile", mobile ? "?1" : "?0")
                .header("sec-ch-ua-platform",
                        userAgent.contains("Android") ? "\"Android\""
                                : (userAgent.contains("iPhone") ? "\"iOS\"" : "\"Windows\""))
                .header("Sec-Fetch-Dest", "document")
                .header("Sec-Fetch-Mode", "navigate")
                .header("Sec-Fetch-Site", "none")
                .header("Sec-Fetch-User", "?1")
                .timeout(20_000)
                .followRedirects(true)
                .maxBodySize(0)
                .ignoreHttpErrors(true);
    }

    public static boolean looksBlocked(String body) {
        if (body == null || body.length() < 50_000) {
            String lower = body == null ? "" : body.toLowerCase(Locale.ROOT);
            return body == null
                    || body.length() < 8_000
                    || lower.contains("api-services-support@amazon.com")
                    || lower.contains("enter the characters you see below")
                    || lower.contains("robot check")
                    || (lower.contains("captcha")
                    && !lower.contains("producttitle")
                    && !lower.contains("id=\"title\"")
                    && !lower.contains("s-search-result"));
        }
        String lower = body.toLowerCase(Locale.ROOT);
        return lower.contains("api-services-support@amazon.com")
                && lower.contains("validatecaptcha");
    }

    public static String uaFamily(String ua) {
        if (ua.contains("Android")) return "Android mobile";
        if (ua.contains("iPhone")) return "iPhone mobile";
        return "desktop";
    }

    public static void politePause(long millis) {
        try {
            Thread.sleep(Math.max(0, millis));
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            log.debug("Crawl pause interrupted");
        }
    }
}
