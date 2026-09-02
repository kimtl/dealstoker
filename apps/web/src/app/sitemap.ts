import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/api";
import { getSiteUrl } from "@/lib/site";
import type { ProductSummary } from "@/lib/types";

function parseDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function productLastModified(product: ProductSummary): Date | undefined {
  return (
    parseDate(product.updatedAt) ||
    parseDate(product.publishedAt) ||
    undefined
  );
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/disclosure`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  let categoryRoutes: MetadataRoute.Sitemap = [];
  let productRoutes: MetadataRoute.Sitemap = [];

  try {
    const categories = await getCategories();
    categoryRoutes = categories
      .filter((category) => category.active !== false)
      .map((category) => ({
        url: `${siteUrl}/c/${category.slug}`,
        lastModified: parseDate(category.updatedAt) || now,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));
  } catch {
    categoryRoutes = ["home-kitchen", "electronics", "outdoor-sports"].map(
      (slug) => ({
        url: `${siteUrl}/c/${slug}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }),
    );
  }

  try {
    const products = await fetchPublishedProducts();
    productRoutes = products.map((product) => ({
      url: `${siteUrl}/p/${product.slug}`,
      lastModified: productLastModified(product) || now,
      changeFrequency: "daily" as const,
      priority: product.featured ? 0.85 : 0.7,
      ...(product.imageUrl ? { images: [product.imageUrl] } : {}),
    }));
  } catch {
    productRoutes = [];
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
