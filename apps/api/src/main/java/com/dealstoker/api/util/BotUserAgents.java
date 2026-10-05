package com.dealstoker.api.util;

import java.util.regex.Pattern;

/**
 * Single source of truth for "is this request a bot?".
 *
 * <p>{@link #UA_REGEX} is written so it is valid both as a Java regex and as a
 * PostgreSQL ARE (no backslashes, no quotes, no '?'), which lets native
 * repository queries reuse it via {@code user_agent !~* '...'} and exclude bot
 * rows that were stored before filtering existed.
 */
public final class BotUserAgents {

    public static final String UA_REGEX =
            "bot|crawl|spider|slurp|scrap|headless|phantom|selenium|puppeteer|playwright"
                    + "|lighthouse|pagespeed|pingdom|uptime|monitor|inspectiontool|googleother"
                    + "|mediapartners|feedfetcher|google-read-aloud|preview|facebookexternalhit"
                    + "|meta-externalagent|embedly|whatsapp|telegram|discord|slack|skype|linkedin"
                    + "|ia_archiver|python|curl/|wget/|java/|go-http-client|okhttp|axios|node-fetch"
                    + "|undici|httpclient|libwww|postman|insomnia|dealstoker-web|^node$";

    private static final Pattern COMPILED = Pattern.compile(UA_REGEX, Pattern.CASE_INSENSITIVE);

    private BotUserAgents() {}

    /** Missing or blank user agents count as bots: real browsers always send one. */
    public static boolean isBot(String userAgent) {
        return userAgent == null || userAgent.isBlank() || COMPILED.matcher(userAgent).find();
    }
}
