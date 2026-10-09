package com.dealstoker.api.service;

import com.dealstoker.api.util.SiteTime;
import org.springframework.web.util.HtmlUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/**
 * Renders a newsletter issue as table-based, inline-styled HTML (what email clients support)
 * plus a plain-text version. Product links go to DealStoker pages, never straight to Amazon:
 * Amazon Associates does not allow affiliate links in email.
 */
public final class NewsletterRenderer {

    private NewsletterRenderer() {}

    public record GuideItem(String slug, String title, String titleKo, String excerpt, String excerptKo,
                            String coverImageUrl) {}

    public record ProductItem(String slug, String title, String imageUrl, BigDecimal price,
                              BigDecimal listPrice, String currency, BigDecimal rating, Integer reviewCount,
                              Instant priceCheckedAt) {
        Integer discountPercent() {
            if (price == null || listPrice == null || listPrice.signum() <= 0 || price.compareTo(listPrice) >= 0) {
                return null;
            }
            return listPrice.subtract(price).multiply(BigDecimal.valueOf(100))
                    .divide(listPrice, 0, RoundingMode.HALF_UP).intValue();
        }
    }

    public record IssueContent(List<GuideItem> guides, List<ProductItem> topViewed, List<ProductItem> deals) {
        public boolean isEmpty() {
            return guides.isEmpty() && topViewed.isEmpty() && deals.isEmpty();
        }
    }

    public record Rendered(String subject, String html, String text) {}

    public record Context(long issueId, String locale, String subject, String intro, String baseUrl,
                          String unsubscribeUrl, String postalAddress) {
        boolean ko() {
            return "ko".equals(locale);
        }
    }

    public static Rendered render(IssueContent content, Context ctx) {
        boolean ko = ctx.ko();
        StringBuilder html = new StringBuilder();
        StringBuilder text = new StringBuilder();

        html.append("<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width\">")
                .append("<title>").append(esc(ctx.subject())).append("</title></head>")
                .append("<body style=\"margin:0;background:#f3f3f4;font-family:Arial,Helvetica,sans-serif;color:#1c1c1c\">")
                .append("<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr><td align=\"center\" style=\"padding:24px 12px\">")
                .append("<table role=\"presentation\" width=\"100%\" style=\"max-width:600px;background:#ffffff;border-radius:10px\" cellpadding=\"0\" cellspacing=\"0\">")
                .append("<tr><td style=\"padding:24px 28px 4px;font-size:22px;font-weight:800;letter-spacing:-0.5px\">")
                .append("<a href=\"").append(esc(link(ctx, "/"))).append("\" style=\"color:#141414;text-decoration:none\">")
                .append("<span style=\"color:#eb1c24\">&#9632;</span> DealStoker</a></td></tr>");
        text.append("DealStoker\n\n");

        if (ctx.intro() != null && !ctx.intro().isBlank()) {
            html.append("<tr><td style=\"padding:12px 28px;font-size:15px;line-height:1.6\">")
                    .append(esc(ctx.intro()).replace("\n", "<br>")).append("</td></tr>");
            text.append(ctx.intro().trim()).append("\n\n");
        }

        if (!content.guides().isEmpty()) {
            section(html, text, ko ? "새 구매 가이드" : "New buying guides");
            for (GuideItem guide : content.guides()) {
                String title = ko && notBlank(guide.titleKo()) ? guide.titleKo() : guide.title();
                String excerpt = ko && notBlank(guide.excerptKo()) ? guide.excerptKo() : guide.excerpt();
                String url = link(ctx, "/guides/" + guide.slug());
                html.append("<tr><td style=\"padding:8px 28px\">")
                        .append("<a href=\"").append(esc(url)).append("\" style=\"font-size:17px;font-weight:700;color:#141414;text-decoration:none\">")
                        .append(esc(title)).append("</a>");
                if (notBlank(excerpt)) {
                    html.append("<div style=\"font-size:14px;color:#5f6166;line-height:1.5;margin-top:4px\">").append(esc(excerpt)).append("</div>");
                }
                html.append("<div style=\"margin-top:6px\"><a href=\"").append(esc(url))
                        .append("\" style=\"font-size:14px;font-weight:700;color:#c4141c;text-decoration:none\">")
                        .append(ko ? "가이드 읽기 &rarr;" : "Read the guide &rarr;").append("</a></div></td></tr>");
                text.append("- ").append(title).append("\n  ").append(url).append("\n");
            }
            text.append('\n');
        }

        products(html, text, ctx, ko ? "이번 주 가장 많이 본 상품" : "Most viewed this week", content.topViewed());
        products(html, text, ctx, ko ? "할인 폭이 큰 상품" : "Biggest discounts right now", content.deals());

        String priceNote = ko
                ? "가격은 표시된 시각 기준이며 Amazon에서 바뀔 수 있습니다. 결제 화면의 가격이 최종 가격입니다."
                : "Prices are as of the time shown and can change on Amazon; the price at checkout is the one that counts.";
        String why = ko
                ? "DealStoker 주간 뉴스레터를 구독하셨기 때문에 이 메일을 받으셨습니다."
                : "You're receiving this because you subscribed to the DealStoker weekly newsletter.";
        String unsub = ko ? "구독 해지" : "Unsubscribe";
        String affiliate = ko
                ? "DealStoker는 Amazon Associates 회원으로, 적격 구매 시 Amazon으로부터 소개 수수료를 받습니다. 구매자에게 추가 비용은 없습니다."
                : "As an Amazon Associate DealStoker earns from qualifying purchases. This never costs you extra.";
        html.append("<tr><td style=\"padding:20px 28px 28px;font-size:12px;color:#5f6166;line-height:1.6;border-top:1px solid #ededee\">")
                .append(esc(priceNote)).append("<br><br>").append(esc(affiliate)).append("<br><br>")
                .append(esc(why)).append(" <a href=\"").append(esc(ctx.unsubscribeUrl()))
                .append("\" style=\"color:#5f6166\">").append(unsub).append("</a><br>")
                .append(esc(ctx.postalAddress() == null ? "" : ctx.postalAddress()))
                .append("</td></tr></table></td></tr></table></body></html>");
        text.append(priceNote).append("\n\n").append(affiliate).append("\n\n").append(why).append('\n')
                .append(unsub).append(": ").append(ctx.unsubscribeUrl()).append('\n')
                .append(ctx.postalAddress() == null ? "" : ctx.postalAddress()).append('\n');

        return new Rendered(ctx.subject(), html.toString(), text.toString());
    }

    private static void section(StringBuilder html, StringBuilder text, String title) {
        html.append("<tr><td style=\"padding:20px 28px 4px;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#eb1c24\">")
                .append(esc(title)).append("</td></tr>");
        text.append(title.toUpperCase(Locale.ROOT)).append('\n');
    }

    private static void products(StringBuilder html, StringBuilder text, Context ctx, String title, List<ProductItem> items) {
        if (items.isEmpty()) {
            return;
        }
        boolean ko = ctx.ko();
        section(html, text, title);
        for (ProductItem item : items) {
            String url = link(ctx, "/p/" + item.slug());
            String price = money(item.price(), item.currency(), ko);
            Integer pct = item.discountPercent();
            html.append("<tr><td style=\"padding:8px 28px\"><table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\"><tr>");
            if (notBlank(item.imageUrl())) {
                html.append("<td width=\"72\" valign=\"top\" style=\"padding-right:12px\"><a href=\"").append(esc(url)).append("\">")
                        .append("<img src=\"").append(esc(item.imageUrl())).append("\" width=\"72\" height=\"72\" alt=\"\" style=\"display:block;border:1px solid #ededee;border-radius:6px;object-fit:contain;background:#ffffff\"></a></td>");
            }
            html.append("<td valign=\"top\"><a href=\"").append(esc(url))
                    .append("\" style=\"font-size:15px;font-weight:700;color:#141414;text-decoration:none;line-height:1.35\">")
                    .append(esc(item.title())).append("</a><div style=\"margin-top:4px;font-size:14px\">");
            if (price != null) {
                html.append("<strong style=\"color:#0a7a3e\">").append(esc(price)).append("</strong>");
            }
            if (pct != null && pct >= 5) {
                html.append(" <span style=\"background:#eb1c24;color:#ffffff;font-weight:700;font-size:12px;padding:1px 5px;border-radius:4px\">-")
                        .append(pct).append("%</span>");
            }
            if (item.rating() != null) {
                html.append(" <span style=\"color:#5f6166;font-size:13px\">").append(item.rating().setScale(1, RoundingMode.HALF_UP)).append("&#9733;</span>");
            }
            html.append("</div>");
            if (item.priceCheckedAt() != null && price != null) {
                html.append("<div style=\"font-size:12px;color:#5f6166;margin-top:2px\">")
                        .append(esc((ko ? "가격 확인 " : "Price as of ") + time(item.priceCheckedAt(), ko))).append("</div>");
            }
            html.append("</td></tr></table></td></tr>");
            text.append("- ").append(item.title());
            if (price != null) {
                text.append(" — ").append(price);
                if (pct != null && pct >= 5) text.append(" (-").append(pct).append("%)");
            }
            text.append("\n  ").append(url).append('\n');
        }
        text.append('\n');
    }

    /** Site link with newsletter UTM tags (and ?hl=ko for Korean subscribers). */
    static String link(Context ctx, String path) {
        StringBuilder url = new StringBuilder(ctx.baseUrl()).append(path)
                .append(path.contains("?") ? "&" : "?")
                .append("utm_source=newsletter&utm_medium=email&utm_campaign=issue-").append(ctx.issueId());
        if (ctx.ko()) {
            url.append("&hl=ko");
        }
        return url.toString();
    }

    static String money(BigDecimal amount, String currency, boolean ko) {
        if (amount == null) {
            return null;
        }
        NumberFormat format = NumberFormat.getCurrencyInstance(ko ? Locale.KOREA : Locale.US);
        try {
            format.setCurrency(java.util.Currency.getInstance(currency == null ? "USD" : currency));
        } catch (IllegalArgumentException ignored) {
            format.setCurrency(java.util.Currency.getInstance("USD"));
        }
        // The Korean locale keeps the won's 0 decimals even after switching currency.
        int digits = format.getCurrency().getDefaultFractionDigits();
        format.setMinimumFractionDigits(digits);
        format.setMaximumFractionDigits(digits);
        return format.format(amount);
    }

    static String time(Instant instant, boolean ko) {
        DateTimeFormatter formatter = ko
                ? DateTimeFormatter.ofPattern("yyyy년 M월 d일 a h:mm z", Locale.KOREAN)
                : DateTimeFormatter.ofPattern("MMM d, yyyy, h:mm a z", Locale.US);
        return formatter.withZone(SiteTime.ZONE).format(instant);
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }

    private static String esc(String value) {
        return value == null ? "" : HtmlUtils.htmlEscape(value);
    }
}
