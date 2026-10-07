import type { Metadata } from "next";
import type { FaqItem } from "./faq";
import { buildIntentProductMetaDescription } from "./faq";
import {
  localizedAbsoluteUrl,
  ogLocale,
  schemaLanguage,
  type Locale,
} from "./i18n/locale";
import { localizeCategoryName } from "./i18n/messages";
import { getSiteUrl, SITE_NAME } from "./site";
import { clampText, sanitizeMetaCopy } from "./text";
import type { Category, ProductDetail, ProductSummary } from "./types";

function asNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : null;
}

export { clampText, sanitizeMetaCopy, truncateAtWord } from "./text";

/** Prefer a complete product title over a mid-word-truncated seoTitle. */
function resolveProductTitleCore(product: ProductDetail): string {
  const title = sanitizeMetaCopy(product.title?.trim() || "Amazon Deal");
  const seo = product.seoTitle?.trim();
  if (!seo) return title;

  const cleanedSeo = sanitizeMetaCopy(seo);
  if (title.startsWith(cleanedSeo) && title.length > cleanedSeo.length) {
    const next = title.charAt(cleanedSeo.length);
    if (/[A-Za-z0-9]/.test(next)) {
      // seoTitle was hard-sliced mid-word during import
      return title;
    }
  }
  return cleanedSeo || title;
}

function finalizePageTitle(title: string): string {
  const cleaned = sanitizeMetaCopy(title).replace(
    new RegExp(`\\s*[|—–-]\\s*${SITE_NAME}\\s*$`, "i"),
    "",
  );
  if (cleaned.includes(SITE_NAME)) {
    return clampText(cleaned, 60);
  }
  const suffix = ` | ${SITE_NAME}`;
  const coreMax = Math.max(24, 60 - suffix.length);
  return `${clampText(cleaned, coreMax)}${suffix}`;
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

export function productMetaTitle(
  product: ProductDetail,
  locale: Locale = "en",
): string {
  const core = resolveProductTitleCore(product);
  if (locale !== "ko") return core;
  const cat = product.categoryName
    ? localizeCategoryName(product.categoryName, "ko")
    : "";
  return cat ? `${core} — ${cat} 아마존 딜` : `${core} — 아마존 딜`;
}

export function productMetaDescription(
  product: ProductDetail,
  locale: Locale = "en",
): string {
  if (locale === "ko") {
    const cat = product.categoryName
      ? localizeCategoryName(product.categoryName, "ko")
      : "아마존";
    const price = asNumber(product.priceAmount);
    const priceBit =
      price != null
        ? ` 현재가 $${price.toFixed(price % 1 === 0 ? 0 : 2)}.`
        : "";
    return clampText(
      sanitizeMetaCopy(
        `${product.title} ${cat} 딜을 ${SITE_NAME}에서 확인하세요.${priceBit} 미국 Amazon.com 큐레이션 추천.`,
      ),
      160,
    );
  }
  return clampText(buildIntentProductMetaDescription(product), 160);
}

export function homeMetaTitle(locale: Locale = "en"): string {
  if (locale === "ko") {
    return `${SITE_NAME} — 아마존 딜 & 구매 가이드 (미국)`;
  }
  return `${SITE_NAME} — Amazon Deals & Buying Guides (US)`;
}

export function homeMetaDescription(locale: Locale = "en"): string {
  if (locale === "ko") {
    return clampText(
      `${SITE_NAME}의 Amazon.com 구매 가이드와 오늘의 딜. 사기 전에 확인할 점, 가이드별 추천 상품, 인기 조회와 할인을 미국 쇼핑객을 위해 정리했습니다.`,
      160,
    );
  }
  return clampText(
    `Practical Amazon.com buying guides and today's best deals on ${SITE_NAME}: what to check before you buy, the picks we recommend, top views and price drops.`,
    160,
  );
}

export function homeMetaKeywords(locale: Locale = "en"): string[] {
  if (locale === "ko") {
    return [
      "아마존 딜",
      "아마존 할인",
      "추천 딜",
      "아마존 구매 가이드",
      "미국 아마존",
      "Amazon deals",
      SITE_NAME,
    ];
  }
  return [
    "Amazon deals",
    "best Amazon deals today",
    "Amazon price drops",
    "US Amazon discounts",
    "featured deals",
    "Amazon buying guides",
    SITE_NAME,
  ];
}

export function categoryMetaTitle(
  category: Category,
  locale: Locale = "en",
): string {
  const name = localizeCategoryName(category.name, locale);
  if (locale === "ko") {
    return `아마존 ${name} 딜 추천`;
  }
  if (category.seoTitle?.trim()) {
    return sanitizeMetaCopy(
      category.seoTitle
        .trim()
        .replace(/\s*\|\s*DealStoker\s*$/i, "")
        .replace(/\|\s*$/, "")
        .trim() || `Best ${category.name} Deals on Amazon`,
    );
  }
  return `Best ${category.name} Deals on Amazon`;
}

export function categoryMetaDescription(
  category: Category,
  locale: Locale = "en",
): string {
  const name = localizeCategoryName(category.name, locale);
  if (locale === "ko") {
    return clampText(
      sanitizeMetaCopy(
        `Amazon.com ${name} 딜을 ${SITE_NAME}에서 둘러보세요. 현재 가격, 할인, 추천 상품을 미국 쇼핑객 기준으로 정리합니다.`,
      ),
      160,
    );
  }
  if (category.seoDescription?.trim()) {
    return clampText(sanitizeMetaCopy(category.seoDescription), 160);
  }
  if (category.buyingGuide?.trim()) {
    return clampText(sanitizeMetaCopy(category.buyingGuide), 160);
  }
  const base =
    category.description?.trim() ||
    `Browse curated ${category.name} deals on Amazon.com. ${SITE_NAME} lists price drops, top-rated picks, and featured deals for US shoppers.`;
  return clampText(sanitizeMetaCopy(base), 160);
}

export function searchMetaTitle(q: string, locale: Locale = "en"): string {
  if (!q) {
    return locale === "ko"
      ? `아마존 딜 검색 | ${SITE_NAME}`
      : `Search Amazon deals | ${SITE_NAME}`;
  }
  return locale === "ko"
    ? `“${q}” 검색 | ${SITE_NAME}`
    : `Search “${q}” | ${SITE_NAME}`;
}

export function searchMetaDescription(q: string, locale: Locale = "en"): string {
  if (!q) {
    return locale === "ko"
      ? `${SITE_NAME}에서 Amazon.com 큐레이션 딜을 검색하세요. 카테고리·가격으로 필터할 수 있습니다.`
      : `Search curated Amazon.com deals on ${SITE_NAME}. Filter by category and price.`;
  }
  return locale === "ko"
    ? `${SITE_NAME}의 “${q}” 아마존 딜 검색 결과. 카테고리·가격으로 필터하세요.`
    : `Amazon deals matching “${q}” on ${SITE_NAME}. Filter by category and price.`;
}

export function aboutMetaTitle(locale: Locale = "en"): string {
  return locale === "ko"
    ? `${SITE_NAME} 소개 — 미국 쇼핑객을 위한 아마존 딜 큐레이션`
    : `About ${SITE_NAME} — Amazon Deal Curation for US Shoppers`;
}

export function aboutMetaDescription(locale: Locale = "en"): string {
  return locale === "ko"
    ? `${SITE_NAME}는 미국 온라인 쇼핑객을 위한 아마존 딜 큐레이션 사이트입니다. 잡음을 줄이고 살펴볼 만한 Amazon.com 딜을 모읍니다.`
    : "DealStoker is an Amazon deal curation site for US online shoppers. Since 2026 we cut the noise and highlight practical Amazon.com deals worth your attention.";
}

export function contactMetaTitle(locale: Locale = "en"): string {
  return locale === "ko" ? "문의" : "Contact";
}

export function contactMetaDescription(locale: Locale = "en"): string {
  return locale === "ko"
    ? `${SITE_NAME} 팀에 상품·파트너십·개인정보 관련 문의를 보내 주세요.`
    : `Contact the ${SITE_NAME} team about listings, partnerships, or privacy.`;
}

export function disclosureMetaTitle(locale: Locale = "en"): string {
  return locale === "ko" ? "제휴 고지" : "Affiliate Disclosure";
}

export function disclosureMetaDescription(locale: Locale = "en"): string {
  return locale === "ko"
    ? "DealStoker의 Amazon Associates(미국) 제휴 고지입니다."
    : "DealStoker affiliate disclosure for Amazon Associates (United States).";
}

export function privacyMetaTitle(locale: Locale = "en"): string {
  return locale === "ko" ? "개인정보 처리방침" : "Privacy Policy";
}

export function privacyMetaDescription(locale: Locale = "en"): string {
  return locale === "ko"
    ? `${SITE_NAME}의 개인정보 처리 안내입니다.`
    : `Privacy practices for ${SITE_NAME}.`;
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
      product.recommendation ||
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

export function buildFaqJsonLd(faqs: FaqItem[]): Record<string, unknown> | null {
  const cleaned = faqs
    .map((faq) => ({
      question: faq.question.trim(),
      answer: faq.answer.trim(),
    }))
    .filter((faq) => faq.question && faq.answer);
  if (!cleaned.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: cleaned.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
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

export function buildOrganizationJsonLd(
  locale: Locale = "en",
): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl,
    description: homeMetaDescription(locale),
  };
}

export function buildWebSiteJsonLd(
  locale: Locale = "en",
): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl,
    inLanguage: schemaLanguage(locale),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: siteUrl,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
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
  locale?: Locale;
};

export function buildPageMetadata({
  title,
  description,
  path = "/",
  image,
  noIndex,
  keywords,
  type = "website",
  locale = "en",
}: BuildMetaInput): Metadata {
  const siteUrl = getSiteUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const canonical = localizedAbsoluteUrl(siteUrl, normalizedPath, locale);
  const enUrl = localizedAbsoluteUrl(siteUrl, normalizedPath, "en");
  const koUrl = localizedAbsoluteUrl(siteUrl, normalizedPath, "ko");
  const fullTitle = finalizePageTitle(title);
  const safeDescription = clampText(sanitizeMetaCopy(description), 160);

  return {
    title: fullTitle,
    description: safeDescription,
    keywords: keywords?.length ? keywords : undefined,
    alternates: {
      canonical,
      languages: {
        en: enUrl,
        ko: koUrl,
        "x-default": enUrl,
      },
    },
    openGraph: {
      title: fullTitle,
      description: safeDescription,
      url: canonical,
      siteName: SITE_NAME,
      locale: ogLocale(locale),
      alternateLocale: locale === "ko" ? ["en_US"] : ["ko_KR"],
      type,
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: fullTitle,
      description: safeDescription,
      ...(image ? { images: [image] } : {}),
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export function buildArticleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  authorName?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  locale?: Locale;
}): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const url = localizedAbsoluteUrl(siteUrl, input.path, input.locale ?? "en");
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: clampText(input.title, 110),
    description: clampText(sanitizeMetaCopy(input.description), 300),
    url,
    mainEntityOfPage: url,
    inLanguage: schemaLanguage(input.locale ?? "en"),
    ...(input.image ? { image: [input.image] } : {}),
    ...(input.publishedAt ? { datePublished: input.publishedAt } : {}),
    ...(input.updatedAt ? { dateModified: input.updatedAt } : {}),
    author: {
      "@type": "Organization",
      name: input.authorName?.trim() || SITE_NAME,
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: siteUrl,
    },
  };
}
