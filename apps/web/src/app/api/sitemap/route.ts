import { getCategories, getProducts, getSitemapXml } from "@/lib/api";
import { getSiteUrl } from "@/lib/site";
import type { ProductSummary } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 300;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function xmlHeaders(): HeadersInit {
  return {
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": "public, max-age=300, s-maxage=300",
    "X-Content-Type-Options": "nosniff",
  };
}

function parseDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function addUrl(
  parts: string[],
  loc: string,
  lastmod?: string | null,
  changefreq?: string,
  priority?: string,
  imageUrl?: string | null,
) {
  parts.push("<url>");
  parts.push(`<loc>${escapeXml(loc)}</loc>`);
  if (lastmod) parts.push(`<lastmod>${escapeXml(lastmod)}</lastmod>`);
  if (changefreq) parts.push(`<changefreq>${changefreq}</changefreq>`);
  if (priority) parts.push(`<priority>${priority}</priority>`);
  if (imageUrl) {
    parts.push("<image:image>");
    parts.push(`<image:loc>${escapeXml(imageUrl)}</image:loc>`);
    parts.push("</image:image>");
  }
  parts.push("</url>");
}

async function fetchPublishedProducts(): Promise<ProductSummary[]> {
  const items: ProductSummary[] = [];
  let page = 0;
  let totalPages = 1;
  while (page < totalPages && page < 50) {
    const data = await getProducts({ page, size: 100, sort: "newest" });
    items.push(...(data.items || []).filter((p) => p.status === "PUBLISHED"));
    totalPages = data.totalPages || 1;
    page += 1;
  }
  return items;
}

async function buildFallbackSitemapXml(): Promise<string> {
  const siteUrl = getSiteUrl();
  const now = new Date().toISOString();
  const parts: string[] = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`,
  ];

  addUrl(parts, `${siteUrl}/`, now, "daily", "1.0");
  addUrl(parts, `${siteUrl}/?hl=ko`, now, "daily", "0.9");
  for (const path of ["/about", "/search", "/disclosure", "/privacy", "/contact"]) {
    addUrl(
      parts,
      `${siteUrl}${path}`,
      now,
      path === "/search" ? "weekly" : "monthly",
      path === "/search" ? "0.5" : "0.4",
    );
    addUrl(
      parts,
      `${siteUrl}${path}?hl=ko`,
      now,
      path === "/search" ? "weekly" : "monthly",
      path === "/search" ? "0.45" : "0.35",
    );
  }

  try {
    const categories = await getCategories();
    for (const category of categories.filter((c) => c.active !== false)) {
      addUrl(
        parts,
        `${siteUrl}/c/${category.slug}`,
        parseDate(category.updatedAt) || now,
        "daily",
        "0.8",
      );
      addUrl(
        parts,
        `${siteUrl}/c/${category.slug}?hl=ko`,
        parseDate(category.updatedAt) || now,
        "daily",
        "0.7",
      );
    }
  } catch {
    for (const slug of ["home-kitchen", "electronics", "outdoor-sports"]) {
      addUrl(parts, `${siteUrl}/c/${slug}`, now, "daily", "0.8");
      addUrl(parts, `${siteUrl}/c/${slug}?hl=ko`, now, "daily", "0.7");
    }
  }

  try {
    const products = await fetchPublishedProducts();
    for (const product of products) {
      const lastmod =
        parseDate(product.updatedAt) || parseDate(product.publishedAt) || now;
      addUrl(
        parts,
        `${siteUrl}/p/${product.slug}`,
        lastmod,
        "daily",
        product.featured ? "0.85" : "0.7",
        product.imageUrl,
      );
      addUrl(
        parts,
        `${siteUrl}/p/${product.slug}?hl=ko`,
        lastmod,
        "daily",
        product.featured ? "0.75" : "0.6",
      );
    }
  } catch {
    // Keep static + category URLs if product fetch fails.
  }

  parts.push("</urlset>");
  return parts.join("");
}

async function sitemapBody(): Promise<string> {
  const fromApi = await getSitemapXml();
  if (fromApi && fromApi.includes("<urlset") && !fromApi.includes("<html")) {
    return fromApi.trim().startsWith("<?xml")
      ? fromApi
      : `<?xml version="1.0" encoding="UTF-8"?>\n${fromApi}`;
  }
  return buildFallbackSitemapXml();
}

/** Canonical public URL is /sitemap.xml (rewritten here). */
export async function GET() {
  const xml = await sitemapBody();
  return new Response(xml, {
    status: 200,
    headers: xmlHeaders(),
  });
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: xmlHeaders(),
  });
}
