package com.dealstoker.api.util;

import java.time.ZoneId;

/** Reporting time zone: days in analytics are US Eastern days (EDT/EST), matching the site. */
public final class SiteTime {

    /** IANA id; also used inside native SQL ({@code AT TIME ZONE}). */
    public static final String ZONE_ID = "America/New_York";
    public static final ZoneId ZONE = ZoneId.of(ZONE_ID);

    private SiteTime() {}
}
