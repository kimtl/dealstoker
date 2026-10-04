/**
 * Hosts that next/image may optimize. Anything else is rendered with
 * `unoptimized` instead of crashing the page with
 * "Invalid src prop ... hostname is not configured".
 * Imported by next.config.ts, so keep this file free of other imports.
 */
export const OPTIMIZED_IMAGE_HOSTS = [
  "m.media-amazon.com",
  "images-na.ssl-images-amazon.com",
  "images-eu.ssl-images-amazon.com",
  "images.unsplash.com",
] as const;

export function canOptimizeImage(src: string | null | undefined): boolean {
  if (!src) return false;
  if (src.startsWith("/")) return true;
  try {
    const url = new URL(src);
    return (
      url.protocol === "https:" &&
      (OPTIMIZED_IMAGE_HOSTS as readonly string[]).includes(url.hostname)
    );
  } catch {
    return false;
  }
}
