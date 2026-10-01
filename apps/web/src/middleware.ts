import { NextRequest, NextResponse } from "next/server";

const CANONICAL_HOST = "www.dealstoker.com";

/**
 * Force apex → www so crawlers never index duplicate hosts.
 * Spaceship already 301s apex→www; this covers direct Railway custom-domain hits.
 */
export function middleware(request: NextRequest) {
  const hostHeader = request.headers.get("host") || "";
  const host = hostHeader.split(":")[0]?.toLowerCase() || "";

  if (host === "dealstoker.com") {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.hostname = CANONICAL_HOST;
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Skip Next internals and common static assets; still redirect HTML/docs.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
