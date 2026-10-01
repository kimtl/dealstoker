import { NextRequest, NextResponse } from "next/server";

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
 *
 * DNS note: apex must hit this Next.js app (Railway custom domain).
 * A Spaceship/hosting “URL redirect” that always sends users to
 * https://www.dealstoker.com (no path) will drop path/query before
 * middleware runs — remove that naked redirect and point apex at Railway.
 */
export function middleware(request: NextRequest) {
  if (requestHost(request) !== "dealstoker.com") {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;
  const destination = `https://${CANONICAL_HOST}${pathname}${search}`;
  return NextResponse.redirect(destination, 301);
}

export const config = {
  matcher: [
    /*
     * Skip Next internals and common static assets; still redirect HTML/docs.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
