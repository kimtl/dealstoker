import type { MetadataRoute } from "next";
import { getCategories } from "@/lib/api";
import { getApiBaseUrl, getSiteUrl } from "@/lib/site";
import type { ProductSummary } from "@/lib/types";

type PageResponse = {
  items: ProductSummary[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

async function fetchPublishedProducts(): Promise<ProductSummary[]> {
  const base = getApiBaseUrl();
  const items: ProductSummary[] = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages && page < 50) {
    const res = await fetch(
      `${base}/api/v1/products?page=${page}&size=100&sort=newest`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) break;
    const data = (await res.json()) as PageResponse;
    items.push(...(data.items || []));
    totalPages = data.totalPages || 1;
    page += 1;
  }

  return items;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/disclosure",
    "/privacy",
    "/contact",
  ].map((path) => ({
    url: `${siteUrl}${path || "/"}`,
    changeFrequency: path === "" ? "daily" : "monthly",
    priority: path === "" ? 1 : 0.5,
  }));

  let categoryRoutes: MetadataRoute.Sitemap = [];
  let productRoutes: MetadataRoute.Sitemap = [];

  try {
    const categories = await getCategories();
    categoryRoutes = categories.map((category) => ({
      url: `${siteUrl}/c/${category.slug}`,
      changeFrequency: "daily",
      priority: 0.8,
    }));
  } catch {
    categoryRoutes = [
      "home-kitchen",
      "electronics",
      "outdoor-sports",
    ].map((slug) => ({
      url: `${siteUrl}/c/${slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  }

  try {
    const products = await fetchPublishedProducts();
    productRoutes = products.map((product) => ({
      url: `${siteUrl}/p/${product.slug}`,
      changeFrequency: "daily",
      priority: 0.7,
    }));
  } catch {
    productRoutes = [];
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
