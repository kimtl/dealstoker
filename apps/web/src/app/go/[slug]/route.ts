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
export async function GET(request: NextRequest, context: RouteContext) {
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
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      headers: {
        "user-agent": request.headers.get("user-agent") || "dealstoker-web",
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
