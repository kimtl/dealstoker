"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/google-tag";

/**
 * GA4 events for what matters to the business. One document-level listener catches every
 * outbound Amazon click (all of them go through /go/<slug>), wherever the link is rendered.
 */
export function GoogleEvents() {
  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as Element | null;
      const link = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || !url.pathname.startsWith("/go/")) return;
      trackEvent("click_amazon", {
        product_slug: decodeURIComponent(url.pathname.slice("/go/".length)),
        page_path: window.location.pathname,
        link_location: link.dataset.location || "page",
      });
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
