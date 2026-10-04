/**
 * Pure host/path redirect rules shared by proxy.ts and its unit tests.
 * No Next imports here so the logic can run under plain `node --test`.
 */
export const CANONICAL_HOST = "www.dealstoker.com";
export const CANONICAL_ORIGIN = `https://${CANONICAL_HOST}`;

/** First host from x-forwarded-host / host, lower-cased, port stripped. */
export function normalizeHost(
  forwardedHost: string | null | undefined,
  host: string | null | undefined,
): string {
  const raw = (forwardedHost || host || "").split(",")[0]?.trim();
  return raw?.split(":")[0]?.toLowerCase() || "";
}

export function isDealstokerHost(host: string): boolean {
  return host === "dealstoker.com" || host === CANONICAL_HOST;
}

/**
 * Bare /sitemap or /robots (optionally with trailing slash) → real text
 * endpoints. Returns null when the path is not one of those.
 */
export function crawlerAliasTarget(
  host: string,
  origin: string,
  pathname: string,
  search: string,
): string | null {
  const isRobots = pathname === "/robots" || pathname === "/robots/";
  const isSitemap = pathname === "/sitemap" || pathname === "/sitemap/";
  if (!isRobots && !isSitemap) {
    return null;
  }
  const base = isDealstokerHost(host) ? CANONICAL_ORIGIN : origin;
  return `${base}${isRobots ? "/robots.txt" : "/sitemap.xml"}${search}`;
}

/** Apex → www, preserving path and query. Null when no redirect is needed. */
export function apexToWwwTarget(
  host: string,
  pathname: string,
  search: string,
): string | null {
  if (host !== "dealstoker.com") {
    return null;
  }
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${CANONICAL_ORIGIN}${path}${search}`;
}
