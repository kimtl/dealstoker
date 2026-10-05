import { GOOGLE_ADS_ID } from "@/lib/site";

/**
 * Google tag (gtag.js) for Google Ads, rendered as plain <script> elements
 * inside the root layout's <head>.
 *
 * It must be in the server-rendered HTML exactly like Google's snippet:
 * next/script (afterInteractive) only emitted a preload link and injected the
 * tag after hydration, so Google Ads' tag check could not find it in the page
 * source and reported the installation as failed.
 */
export function GoogleTagHead() {
  if (!GOOGLE_ADS_ID) return null;
  const id = JSON.stringify(GOOGLE_ADS_ID);
  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GOOGLE_ADS_ID)}`}
      />
      <script
        id="google-tag-init"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${id});`,
        }}
      />
    </>
  );
}

/** Admin screens and non-production builds never load the tag. */
export function shouldRenderGoogleTag(pathname: string | null): boolean {
  if (!GOOGLE_ADS_ID || process.env.NODE_ENV !== "production") return false;
  return !(pathname ?? "").startsWith("/admin");
}
