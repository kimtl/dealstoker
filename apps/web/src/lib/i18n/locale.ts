export type Locale = "en" | "ko";

export const LOCALES: Locale[] = ["en", "ko"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "ds_locale";
export const LOCALE_HEADER = "x-dealstoker-locale";
/** Crawlable language query (?hl=ko). Preferred over cookie for SEO bots. */
export const LOCALE_QUERY = "hl";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "ko";
}

/**
 * Prefer explicit ?hl=, then cookie (user choice), otherwise Accept-Language.
 * Korean tags (`ko`, `ko-KR`, …) map to `ko`.
 */
export function detectLocale(
  acceptLanguage: string | null | undefined,
  cookieLocale: string | null | undefined,
  queryLocale?: string | null | undefined,
): Locale {
  if (isLocale(queryLocale)) return queryLocale;
  if (isLocale(cookieLocale)) return cookieLocale;
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const parts = acceptLanguage.split(",").map((part) => part.trim().toLowerCase());
  for (const part of parts) {
    const tag = part.split(";")[0]?.trim() || "";
    if (tag === "ko" || tag.startsWith("ko-")) return "ko";
  }
  return DEFAULT_LOCALE;
}

export function ogLocale(locale: Locale): string {
  return locale === "ko" ? "ko_KR" : "en_US";
}

export function schemaLanguage(locale: Locale): string {
  return locale === "ko" ? "ko-KR" : "en-US";
}

/**
 * Build an absolute site URL for a locale.
 * English omits ?hl= (x-default); Korean always sets ?hl=ko.
 */
export function localizedAbsoluteUrl(
  siteUrl: string,
  path: string,
  locale: Locale,
): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(normalized, `${siteUrl.replace(/\/$/, "")}/`);
  if (locale === "ko") {
    url.searchParams.set(LOCALE_QUERY, "ko");
  } else {
    url.searchParams.delete(LOCALE_QUERY);
  }
  const search = url.searchParams.toString();
  return `${url.origin}${url.pathname}${search ? `?${search}` : ""}`;
}

/**
 * Relative href for in-app language links (keeps other query params).
 * Always sets ?hl=<locale> explicitly so the proxy can persist the choice:
 * a bare URL without ?hl would otherwise fall back to the existing cookie
 * and an "EN" click could never override a stored Korean preference.
 * The proxy strips ?hl=en again (English canonical URLs carry no ?hl).
 */
export function withLocaleQuery(
  pathname: string,
  currentSearch: string,
  locale: Locale,
): string {
  const params = new URLSearchParams(
    currentSearch.startsWith("?") ? currentSearch.slice(1) : currentSearch,
  );
  params.set(LOCALE_QUERY, locale);
  const q = params.toString();
  const path = pathname || "/";
  return q ? `${path}?${q}` : path;
}

/** Remove ?hl= from a search string; returns "" or "?a=b". */
export function stripLocaleQuery(search: string): string {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  params.delete(LOCALE_QUERY);
  const q = params.toString();
  return q ? `?${q}` : "";
}
