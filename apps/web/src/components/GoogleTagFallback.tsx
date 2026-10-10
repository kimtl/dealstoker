"use client";

import { useEffect } from "react";
import { googleTagSrc } from "@/lib/google-tag";

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
export function GoogleTagFallback({ ids }: { ids: string[] }) {
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
    for (const id of ids) w.gtag("config", id);
    for (const id of ids) {
      const src = googleTagSrc(id);
      if (document.querySelector(`script[src="${src}"]`)) continue;
      const script = document.createElement("script");
      script.async = true;
      script.src = src;
      document.head.appendChild(script);
    }
    // ids is a build-time constant list; join keeps the dependency stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);
  return null;
}
