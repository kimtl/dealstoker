"use client";

import { useEffect } from "react";
import { googleTagSrc } from "@/components/GoogleTag";

type GtagWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

/**
 * Safety net for pages whose HTML is rendered in the browser instead of on the server.
 * When a page calls notFound() (deleted or unpublished product, guide or category),
 * Next sends an almost empty HTML shell and React builds the page client-side; inline
 * scripts inserted that way never execute, so the Google tag never started there.
 * On normal pages the inline snippet in <head> has already defined window.gtag and
 * this does nothing.
 */
export function GoogleTagFallback({ id }: { id: string }) {
  useEffect(() => {
    const w = window as GtagWindow;
    if (typeof w.gtag === "function") return;
    w.dataLayer = w.dataLayer || [];
    w.gtag = function gtag() {
      // gtag.js expects the Arguments object itself, exactly like Google's snippet.
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
    w.gtag("js", new Date());
    w.gtag("config", id);
    if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
      const script = document.createElement("script");
      script.async = true;
      script.src = googleTagSrc(id);
      document.head.appendChild(script);
    }
  }, [id]);
  return null;
}
