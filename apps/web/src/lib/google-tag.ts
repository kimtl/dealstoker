/**
 * Google tag (gtag.js) snippet text, kept identical to the snippet Google Ads gives you,
 * because some tag checks match it literally (single quotes, same lines).
 */

/** Google tag IDs look like AW-123, G-ABC123 or GT-XYZ; anything else is rejected. */
export const GOOGLE_TAG_ID_PATTERN = /^(AW|G|GT|DC)-[A-Z0-9]+$/i;

export function isValidGoogleTagId(id: string): boolean {
  return GOOGLE_TAG_ID_PATTERN.test(id);
}

export function googleTagSrc(id: string): string {
  return `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
}

/**
 * Body of the inline config script. The first ID keeps Google's snippet text exactly; extra
 * IDs (e.g. a GA4 measurement ID next to the Google Ads ID) get their own config line, so one
 * gtag.js load serves both. Every ID must pass {@link isValidGoogleTagId}.
 */
export function googleTagInitScript(id: string, extraIds: string[] = []): string {
  for (const value of [id, ...extraIds]) {
    if (!isValidGoogleTagId(value)) {
      throw new Error(`Invalid Google tag ID: ${value}`);
    }
  }
  const extra = extraIds.map((value) => `  gtag('config', '${value}');\n`).join("");
  return `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${id}');
${extra}`;
}

type Gtag = (...args: unknown[]) => void;

/**
 * Sends a GA4 event when the Google tag is on the page (production, non-admin). Safe to call
 * anywhere: it does nothing during SSR, in development or when the tag is blocked.
 */
export function trackEvent(name: string, params: Record<string, string | number | undefined> = {}): void {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag === "function") {
    gtag("event", name, { ...params, transport_type: "beacon" });
  }
}
