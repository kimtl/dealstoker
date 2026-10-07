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

/** Body of the inline config script; `id` must pass {@link isValidGoogleTagId}. */
export function googleTagInitScript(id: string): string {
  if (!isValidGoogleTagId(id)) {
    throw new Error(`Invalid Google tag ID: ${id}`);
  }
  return `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${id}');
`;
}
