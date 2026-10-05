import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

function robotsBody(): string {
  const siteUrl = getSiteUrl();
  const host = new URL(siteUrl).host;
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api/backend",
    "Disallow: /api/v1/admin",
    // Affiliate redirects: crawlers following them inflate click stats.
    "Disallow: /go/",
    "",
    `Host: ${host}`,
    `Sitemap: ${siteUrl}/sitemap.xml`,
    "",
  ].join("\n");
}

function robotsHeaders(): HeadersInit {
  return {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "public, max-age=3600, s-maxage=3600",
    "X-Content-Type-Options": "nosniff",
  };
}

/** Canonical public URL is /robots.txt (rewritten here). */
export async function GET() {
  return new Response(robotsBody(), {
    status: 200,
    headers: robotsHeaders(),
  });
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: robotsHeaders(),
  });
}
