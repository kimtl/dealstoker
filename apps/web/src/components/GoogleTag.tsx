import { googleTagInitScript, googleTagSrc, isValidGoogleTagId } from "@/lib/google-tag";
import { GOOGLE_TAG_IDS } from "@/lib/site";

/**
 * Google tag (gtag.js) for Google Ads and, when configured, Google Analytics 4, rendered as
 * plain <script> elements inside the root layout's <head>, with the same text as Google's
 * snippet. gtag.js is loaded once per ID (Google Analytics' own snippet loads it with the G- ID,
 * and its installation check looks for that), while one inline block configures them all.
 *
 * It must be in the server-rendered HTML exactly like Google's snippet:
 * next/script (afterInteractive) only emitted a preload link and injected the
 * tag after hydration, so Google Ads' tag check could not find it in the page
 * source and reported the installation as failed.
 */
export function GoogleTagHead() {
  const ids = GOOGLE_TAG_IDS.filter(isValidGoogleTagId);
  if (ids.length === 0) return null;
  const [primary, ...extra] = ids;
  return (
    <>
      {ids.map((id) => (
        <script key={id} async src={googleTagSrc(id)} />
      ))}
      <script
        id="google-tag-init"
        dangerouslySetInnerHTML={{ __html: googleTagInitScript(primary, extra) }}
      />
    </>
  );
}

/** Admin screens and non-production builds never load the tag. */
export function shouldRenderGoogleTag(pathname: string | null): boolean {
  if (GOOGLE_TAG_IDS.length === 0 || process.env.NODE_ENV !== "production") return false;
  return !(pathname ?? "").startsWith("/admin");
}
