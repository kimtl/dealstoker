"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { API_PROXY_PREFIX } from "@/lib/site";

const VISITOR_COOKIE = "ds_vid";
const SESSION_COOKIE = "ds_sid";
const VISITOR_MAX_AGE = 60 * 60 * 24 * 365;
const SESSION_MAX_AGE = 60 * 30;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

function writeCookie(name: string, value: string, maxAge: number): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`;
}

function ensureId(name: string, maxAge: number): string {
  const existing = readCookie(name);
  if (existing) {
    writeCookie(name, existing, maxAge);
    return existing;
  }
  const created =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  writeCookie(name, created, maxAge);
  return created;
}

function productSlugFromPath(path: string): string | null {
  const match = path.match(/^\/p\/([^/?#]+)/);
  return match?.[1] ?? null;
}

function shouldTrack(path: string): boolean {
  if (!path) return false;
  if (path.startsWith("/admin")) return false;
  if (path.startsWith("/api")) return false;
  if (path.startsWith("/go/")) return false;
  return true;
}

export function AnalyticsBeacon() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || !shouldTrack(pathname)) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    const visitorKey = ensureId(VISITOR_COOKIE, VISITOR_MAX_AGE);
    const sessionKey = ensureId(SESSION_COOKIE, SESSION_MAX_AGE);
    const body = JSON.stringify({
      path: pathname,
      productSlug: productSlugFromPath(pathname),
      referrer: document.referrer || null,
      visitorKey,
      sessionKey,
    });

    const url = `${API_PROXY_PREFIX}/api/v1/analytics/pageview`;
    try {
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(url, blob);
        return;
      }
    } catch {
      // fall through to fetch
    }

    void fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // Analytics must never break the page.
    });
  }, [pathname]);

  return null;
}
