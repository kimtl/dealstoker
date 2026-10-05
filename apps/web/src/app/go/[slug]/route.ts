import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl, isUnconfiguredApiBase } from "@/lib/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

const DROP_RESPONSE_HEADERS = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "content-encoding",
  "content-length",
]);

/**
 * Runtime proxy for affiliate redirects so API_BASE_URL is read at request
 * time (Next rewrites bake the destination at build time).
 */
async function proxyRedirect(
  request: NextRequest,
  context: RouteContext,
  method: "GET" | "HEAD",
) {
  const { slug } = await context.params;
  const apiBase = getApiBaseUrl();
  if (isUnconfiguredApiBase(apiBase)) {
    return NextResponse.json(
      { error: "API_BASE_URL is not configured" },
      { status: 503 },
    );
  }

  const apiUrl = new URL(`${apiBase}/go/${encodeURIComponent(slug)}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    apiUrl.searchParams.set(key, value);
  });

  const sessionId =
    request.cookies.get("ds_sid")?.value ||
    request.nextUrl.searchParams.get("sid");
  if (sessionId && !apiUrl.searchParams.has("sid")) {
    apiUrl.searchParams.set("sid", sessionId);
  }

  try {
    const upstream = await fetch(apiUrl.toString(), {
      // Forward HEAD as HEAD so link checkers are not recorded as clicks.
      method,
      redirect: "manual",
      cache: "no-store",
      headers: {
        // Pass the visitor's UA through untouched (empty when absent) so the
        // API can tell browsers from bots; never substitute a fake one.
        "user-agent": request.headers.get("user-agent") ?? "",
        referer: request.headers.get("referer") || "",
        "x-forwarded-for":
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "",
      },
    });

    const location = upstream.headers.get("location");
    if (location && upstream.status >= 300 && upstream.status < 400) {
      const target = new URL(location, apiUrl);
      const response = NextResponse.redirect(
        target,
        upstream.status as 301 | 302 | 303 | 307 | 308,
      );
      // A cached redirect would skip click logging on the API.
      response.headers.set("Cache-Control", "no-store");
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      return response;
    }

    const headers = new Headers();
    upstream.headers.forEach((value, key) => {
      if (!DROP_RESPONSE_HEADERS.has(key.toLowerCase())) {
        headers.set(key, value);
      }
    });
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upstream API unreachable";
    return NextResponse.json({ error: "Bad gateway", message }, { status: 502 });
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRedirect(request, context, "GET");
}

export async function HEAD(request: NextRequest, context: RouteContext) {
  return proxyRedirect(request, context, "HEAD");
}
