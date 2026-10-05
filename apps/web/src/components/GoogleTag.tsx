import Script from "next/script";
import { GOOGLE_ADS_ID } from "@/lib/site";

/**
 * Google tag (gtag.js) for Google Ads conversion tracking.
 * Rendered only on public pages in production builds so admin screens and
 * local development never send hits. The ID is public by design.
 */
export function GoogleTag() {
  if (!GOOGLE_ADS_ID || process.env.NODE_ENV !== "production") {
    return null;
  }
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GOOGLE_ADS_ID)}`}
        strategy="afterInteractive"
      />
      <Script id="google-tag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_ID}');`}
      </Script>
    </>
  );
}
