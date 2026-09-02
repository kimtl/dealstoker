import type { Metadata } from "next";
import { formatMoney } from "./format";
import { getSiteUrl, SITE_NAME } from "./site";
import type { Category, ProductDetail, ProductSummary } from "./types";

function asNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : null;
}

function clampText(text: string, max: number): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trimEnd()}…`;
}

/** P0: descriptive alt text from product name (+ brand when useful). */
export function productImageAlt(
  product: Pick<ProductSummary, "title" | "brand">,
): string {
  const title = product.title?.trim() || "Amazon product";
  const brand = product.brand?.trim();
  if (brand && !title.toLowerCase().includes(brand.toLowerCase())) {
    return `${title} by ${brand}`;
  }
  return title;
}

export function productMetaTitle(product: ProductDetail): string {
  if (product.seoTitle?.trim()) return product.seoTitle.trim();
  const price = formatMoney(product.priceAmount, product.currency);
  const category = product.categoryName?.trim();
  const bits = [product.title.trim()];
  if (price) bits.push(`Deal ${price}`);
  else bits.push("Amazon Deal");
  if (category) bits.push(category);
  return clampText(bits.join(" | "), 60);
}

export function productMetaDescription(product: ProductDetail): string {
  if (product.seoDescription?.trim()) {
    return clampText(product.seoDescription.trim(), 160);
  }
  const price = formatMoney(product.priceAmount, product.currency);
  const rating = asNumber(product.rating);
  const reviews = product.reviewCount;
  const category = product.categoryName || "Amazon";
  const brand = product.brand ? `${product.brand} ` : "";
  const ratingBit =
    rating != null
      ? ` Rated ${rating.toFixed(1)}/5${reviews ? ` from ${reviews} reviews` : ""}.`
      : "";
  const priceBit = price ? ` Current price ${price}.` : "";
  const base =
    product.description?.trim() ||
    `Shop the ${brand}${product.title} ${category} deal on Amazon.com via ${SITE_NAME}.${priceBit}${ratingBit} Compare price, rating, and availability before you buy.`;
  return clampText(base, 160);
}

export function categoryMetaTitle(category: Category): string {
  if (category.seoTitle?.trim()) return category.seoTitle.trim();
  return clampText(`${category.name} Deals & Sales on Amazon`, 60);
}

export function categoryMetaDescription(category: Category): string {
  if (category.seoDescription?.trim()) {
    return clampText(category.seoDescription.trim(), 160);
  }
  const base =
    category.description?.trim() ||
    `Browse curated ${category.name} deals on Amazon.com. ${SITE_NAME} lists price drops, top-rated picks, and featured deals for US shoppers.`;
  return clampText(base, 160);
}

export function homeMetaTitle(): string {
  return `${SITE_NAME} — Amazon Deals, Price Drops & Featured Deals (US)`;
}

export function homeMetaDescription(): string {
  return clampText(
    `Find today's best Amazon.com deals on ${SITE_NAME}. Featured deals, top buys, and curated home, electronics, and outdoor products with clear prices for US shoppers.`,
    160,
  );
}

export function buildProductJsonLd(product: ProductDetail): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const productUrl = `${siteUrl}/p/${product.slug}`;
  const price = asNumber(product.priceAmount);
  const rating = asNumber(product.rating);

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.title,
    description:
      product.seoDescription ||
      product.description ||
      `${product.title} curated deal on ${SITE_NAME}`,
    url: productUrl,
    sku: product.externalId,
    mpn: product.externalId,
    image: product.imageUrl ? [product.imageUrl] : undefined,
    category: product.categoryName || undefined,
    brand: product.brand
      ? { "@type": "Brand", name: product.brand }
      : undefined,
  };

  if (price != null) {
    const validUntil = new Date();
    validUntil.setUTCDate(validUntil.getUTCDate() + 14);
    data.offers = {
      "@type": "Offer",
      url: `${siteUrl}/go/${product.slug}`,
      priceCurrency: product.currency || "USD",
      price: price.toFixed(2),
      priceValidUntil: validUntil.toISOString().slice(0, 10),
      availability:
        product.availability === "InStock" || !product.availability
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "Amazon.com",
      },
    };
  }

  if (rating != null && product.reviewCount && product.reviewCount > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(rating.toFixed(1)),
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return data;
}

export function buildBreadcrumbJsonLd(
  items: { name: string; path: string }[],
): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
    })),
  };
}

export function buildItemListJsonLd(
  name: string,
  products: ProductSummary[],
  path: string,
): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: products.length,
    url: `${siteUrl}${path}`,
    itemListElement: products.slice(0, 20).map((product, index) => {
      const price = asNumber(product.priceAmount);
      const rating = asNumber(product.rating);
      const productUrl = `${siteUrl}/p/${product.slug}`;
      const item: Record<string, unknown> = {
        "@type": "Product",
        name: product.title,
        url: productUrl,
        image: product.imageUrl || undefined,
        brand: product.brand
          ? { "@type": "Brand", name: product.brand }
          : undefined,
      };
      if (price != null) {
        item.offers = {
          "@type": "Offer",
          url: `${siteUrl}/go/${product.slug}`,
          priceCurrency: product.currency || "USD",
          price: price.toFixed(2),
          availability: "https://schema.org/InStock",
          itemCondition: "https://schema.org/NewCondition",
        };
      }
      if (rating != null && product.reviewCount && product.reviewCount > 0) {
        item.aggregateRating = {
          "@type": "AggregateRating",
          ratingValue: Number(rating.toFixed(1)),
          reviewCount: product.reviewCount,
          bestRating: 5,
          worstRating: 1,
        };
      }
      return {
        "@type": "ListItem",
        position: index + 1,
        url: productUrl,
        item,
      };
    }),
  };
}

export function buildOrganizationJsonLd(): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl,
    description: homeMetaDescription(),
  };
}

export function buildWebSiteJsonLd(): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl,
    inLanguage: "en-US",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: siteUrl,
    },
  };
}

type BuildMetaInput = {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  noIndex?: boolean;
  keywords?: string[];
  type?: "website" | "article";
};

export function buildPageMetadata({
  title,
  description,
  path = "/",
  image,
  noIndex,
  keywords,
  type = "website",
}: BuildMetaInput): Metadata {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const fullTitle = title.includes(SITE_NAME)
    ? title
    : `${title} | ${SITE_NAME}`;
  const safeDescription = clampText(description, 160);

  return {
    title: fullTitle,
    description: safeDescription,
    keywords: keywords?.length ? keywords : undefined,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description: safeDescription,
      url,
      siteName: SITE_NAME,
      locale: "en_US",
      type,
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: fullTitle,
      description: safeDescription,
      ...(image ? { images: [image] } : {}),
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}
