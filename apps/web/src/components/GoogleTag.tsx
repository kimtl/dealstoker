import { googleTagInitScript, googleTagSrc, isValidGoogleTagId } from "@/lib/google-tag";
import { GOOGLE_ADS_ID } from "@/lib/site";

/**
 * Google tag (gtag.js) for Google Ads, rendered as plain <script> elements
 * inside the root layout's <head>, with the same text as Google's snippet.
 *
 * It must be in the server-rendered HTML exactly like Google's snippet:
 * next/script (afterInteractive) only emitted a preload link and injected the
 * tag after hydration, so Google Ads' tag check could not find it in the page
 * source and reported the installation as failed.
 */
export function GoogleTagHead() {
  if (!GOOGLE_ADS_ID || !isValidGoogleTagId(GOOGLE_ADS_ID)) return null;
  return (
    <>
      <script async src={googleTagSrc(GOOGLE_ADS_ID)} />
      <script
        id="google-tag-init"
        dangerouslySetInnerHTML={{ __html: googleTagInitScript(GOOGLE_ADS_ID) }}
      />
    </>
  );
}

/** Admin screens and non-production builds never load the tag. */
export function shouldRenderGoogleTag(pathname: string | null): boolean {
  if (!GOOGLE_ADS_ID || process.env.NODE_ENV !== "production") return false;
  return !(pathname ?? "").startsWith("/admin");
}
