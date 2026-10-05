import { NextRequest, NextResponse } from "next/server";
import {
  detectLocale,
  isLocale,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  LOCALE_QUERY,
  PATHNAME_HEADER,
  stripLocaleQuery,
} from "@/lib/i18n/locale";
import {
  apexToWwwTarget,
  crawlerAliasTarget,
  normalizeHost,
} from "@/lib/redirects";

const LOCALE_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

function requestHost(request: NextRequest): string {
  return normalizeHost(
    request.headers.get("x-forwarded-host"),
    request.headers.get("host"),
  );
}

/**
 * Force apex → www so crawlers never index duplicate hosts.
 * Preserves path + query (e.g. /c/electronics?sort=newest).
 * Honors ?hl=ko|en for crawlable locale URLs, then cookie / Accept-Language.
 */
export function proxy(request: NextRequest) {
  const { pathname, search, origin } = request.nextUrl;
  const host = requestHost(request);

  // Bare /sitemap or /robots HTML 404s — send crawlers to the real endpoints.
  const alias = crawlerAliasTarget(host, origin, pathname, search);
  if (alias) {
    return NextResponse.redirect(alias, 301);
  }

  const www = apexToWwwTarget(host, pathname, search);
  if (www) {
    return NextResponse.redirect(www, 301);
  }

  // Keep robots/sitemap and API passthroughs free of locale cookies.
  if (
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/go/")
  ) {
    return NextResponse.next();
  }

  const hl = request.nextUrl.searchParams.get(LOCALE_QUERY);
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;

  // ?hl=en is only a switch signal: persist the choice, then redirect to the
  // clean English URL (English canonical URLs never carry ?hl).
  if (hl === "en") {
    const target = `${origin}${pathname}${stripLocaleQuery(search)}`;
    const response = NextResponse.redirect(target, 302);
    response.cookies.set(LOCALE_COOKIE, "en", LOCALE_COOKIE_OPTIONS);
    return response;
  }

  const locale = detectLocale(
    request.headers.get("accept-language"),
    cookieLocale,
    hl,
  );
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER, locale);
  requestHeaders.set(PATHNAME_HEADER, pathname);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set(LOCALE_HEADER, locale);

  // Persist ?hl=ko always; otherwise auto-set when no valid cookie exists.
  if (isLocale(hl) || !isLocale(cookieLocale)) {
    response.cookies.set(LOCALE_COOKIE, locale, LOCALE_COOKIE_OPTIONS);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
