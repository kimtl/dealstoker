export const SITE_NAME = "DealStoker";
/** Bare domain for display (footer, about copy). */
export const SITE_DOMAIN = "dealstoker.com";
/** Preferred public host — must match live DNS (apex 301 → www). */
export const SITE_CANONICAL_HOST = "www.dealstoker.com";
export const SITE_CANONICAL_URL = `https://${SITE_CANONICAL_HOST}`;

/**
 * Normalize production site URL to https://www.dealstoker.com.
 * Localhost and Railway preview hosts are left unchanged.
 */
export function canonicalizeSiteUrl(raw: string): string {
  const trimmed = (raw || "").trim().replace(/\/$/, "");
  if (!trimmed) {
    return SITE_CANONICAL_URL;
  }
  try {
    const withProtocol = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    const host = url.hostname.toLowerCase();

    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".localhost") ||
      host.endsWith(".railway.app")
    ) {
      return `${url.protocol}//${url.host}`.replace(/\/$/, "");
    }

    if (host === "dealstoker.com" || host === "www.dealstoker.com") {
      return SITE_CANONICAL_URL;
    }

    return `${url.protocol}//${url.host}`.replace(/\/$/, "");
  } catch {
    return SITE_CANONICAL_URL;
  }
}

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || SITE_CANONICAL_URL;
  return canonicalizeSiteUrl(raw);
}

export function getApiBaseUrl(): string {
  const raw = process.env.API_BASE_URL || "http://localhost:8080";
  return raw.replace(/\/$/, "");
}

/** True when a production build still points at the Dockerfile's localhost default. */
export function isUnconfiguredApiBase(apiBase: string): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    (!apiBase || /localhost|127\.0\.0\.1/.test(apiBase))
  );
}

export const DEFAULT_GOOGLE_ADS_ID = "AW-18495871546";

/**
 * Resolve the Google Ads tag ID from NEXT_PUBLIC_GOOGLE_ADS_ID.
 * Unset or empty means "use the default" (Docker turns an unset ARG into an
 * empty ENV, which previously disabled the tag in production by accident).
 * Only an explicit "off" / "none" / "false" / "0" disables the tag.
 */
export function resolveGoogleAdsId(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return DEFAULT_GOOGLE_ADS_ID;
  if (/^(off|none|false|0|disabled?)$/i.test(value)) return "";
  return value;
}

export const GOOGLE_ADS_ID: string = resolveGoogleAdsId(
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
);

/** Browser-safe proxy prefix that rewrites to the API. */
export const API_PROXY_PREFIX = "/api/backend";
