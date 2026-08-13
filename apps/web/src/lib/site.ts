export const SITE_NAME = "DealStoker";
export const SITE_DOMAIN = "dealstoker.com";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || `https://${SITE_DOMAIN}`;
  return raw.replace(/\/$/, "");
}

export function getApiBaseUrl(): string {
  const raw = process.env.API_BASE_URL || "http://localhost:8080";
  return raw.replace(/\/$/, "");
}

/** Browser-safe proxy prefix that rewrites to the API. */
export const API_PROXY_PREFIX = "/api/backend";

export const AFFILIATE_DISCLOSURE_SHORT =
  "As an Amazon Associate, DealStoker earns from qualifying purchases.";

export const AFFILIATE_DISCLOSURE_LONG =
  "DealStoker is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. Prices and availability are accurate as of the time of writing and may change.";
