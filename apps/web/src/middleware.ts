import { NextRequest, NextResponse } from "next/server";
import {
  detectLocale,
  isLocale,
  LOCALE_COOKIE,
  LOCALE_HEADER,
} from "@/lib/i18n/locale";

const CANONICAL_HOST = "www.dealstoker.com";

function requestHost(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-host");
  const raw = (forwarded || request.headers.get("host") || "")
    .split(",")[0]
    ?.trim();
  return raw?.split(":")[0]?.toLowerCase() || "";
}

/**
 * Force apex → www so crawlers never index duplicate hosts.
 * Preserves path + query (e.g. /c/electronics?sort=newest).
 * Also stamps detected locale for server components.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Bare /sitemap is a Next HTML 404 — send crawlers to the XML endpoint.
  if (pathname === "/sitemap" || pathname === "/sitemap/") {
    const host = requestHost(request);
    const base =
      host === "dealstoker.com" || host === "www.dealstoker.com"
        ? `https://${CANONICAL_HOST}`
        : request.nextUrl.origin;
    return NextResponse.redirect(`${base}/sitemap.xml${search}`, 301);
  }

  if (requestHost(request) === "dealstoker.com") {
    const destination = `https://${CANONICAL_HOST}${pathname}${search}`;
    return NextResponse.redirect(destination, 301);
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = detectLocale(
    request.headers.get("accept-language"),
    cookieLocale,
  );
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER, locale);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set(LOCALE_HEADER, locale);

  // Persist detected locale only when user has not chosen one yet.
  // Skip /api/locale — that route sets the cookie itself on language switch.
  if (!isLocale(cookieLocale) && pathname !== "/api/locale") {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
