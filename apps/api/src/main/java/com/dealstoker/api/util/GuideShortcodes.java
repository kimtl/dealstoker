package com.dealstoker.api.util;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** {@code {{product:slug}}} shortcodes in guide bodies (same syntax as apps/web/src/lib/guides.ts). */
public final class GuideShortcodes {

    public static final Pattern PRODUCT_SHORTCODE =
            Pattern.compile("\\{\\{\\s*product:\\s*([a-z0-9][a-z0-9-]*)\\s*\\}\\}", Pattern.CASE_INSENSITIVE);

    private GuideShortcodes() {}

    /** Unique slugs in order of appearance across the given bodies (nulls skipped). */
    public static List<String> productSlugs(String... bodies) {
        Set<String> slugs = new LinkedHashSet<>();
        for (String body : bodies) {
            if (body == null) {
                continue;
            }
            Matcher matcher = PRODUCT_SHORTCODE.matcher(body);
            while (matcher.find()) {
                slugs.add(matcher.group(1).toLowerCase(Locale.ROOT));
            }
        }
        return List.copyOf(slugs);
    }

    /**
     * Drops shortcodes whose slug is not allowed (e.g. invented by the AI) and repeats of a slug
     * already used, then tidies the blank lines left behind.
     */
    public static String keepOnly(String body, Set<String> allowedSlugs) {
        if (body == null) {
            return null;
        }
        Set<String> seen = new LinkedHashSet<>();
        Matcher matcher = PRODUCT_SHORTCODE.matcher(body);
        StringBuilder out = new StringBuilder();
        while (matcher.find()) {
            String slug = matcher.group(1).toLowerCase(Locale.ROOT);
            boolean keep = allowedSlugs.contains(slug) && seen.add(slug);
            matcher.appendReplacement(out, keep ? Matcher.quoteReplacement("{{product:" + slug + "}}") : "");
        }
        matcher.appendTail(out);
        return out.toString().replaceAll("\n{3,}", "\n\n").trim();
    }
}
