import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  // Prevent the browser from hijacking fetch() with a native Basic-auth dialog
  // (cancel → TypeError: Failed to fetch).
  "www-authenticate",
]);

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const apiBase = getApiBaseUrl();
  if (
    process.env.NODE_ENV === "production" &&
    (!apiBase || /localhost|127\.0\.0\.1/.test(apiBase))
  ) {
    return NextResponse.json(
      {
        error: "API_BASE_URL is not configured",
        message:
          "Set the Web service API_BASE_URL to https://api.dealstoker.com and redeploy.",
        apiBase,
      },
      { status: 503 },
    );
  }
  const suffix = path?.length ? path.join("/") : "";
  const target = `${apiBase}/${suffix}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower) || lower === "accept-encoding") {
      return;
    }
    headers.set(key, value);
  });

  // Next may not always expose Authorization via forEach — set explicitly.
  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers.set("authorization", authorization);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upstream API unreachable";
    return NextResponse.json(
      {
        error: "Bad gateway",
        message,
        target: apiBase,
      },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (
      HOP_BY_HOP.has(lower) ||
      lower === "content-encoding" ||
      lower === "content-length"
    ) {
      return;
    }
    responseHeaders.set(key, value);
  });

  // Always return a JSON body for 401 so the admin UI can show a clear message.
  if (upstream.status === 401) {
    const text = await upstream.text().catch(() => "");
    return NextResponse.json(
      {
        error: "unauthorized",
        message:
          text ||
          "Unauthorized — check Railway API ADMIN_USERNAME / ADMIN_PASSWORD",
      },
      { status: 401, headers: responseHeaders },
    );
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
export const HEAD = proxy;
