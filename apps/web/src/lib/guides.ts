import type { Locale } from "@/lib/i18n/locale";
import type { GuideDetail, GuideSummary } from "@/lib/types";

/** Pick the localized title/excerpt/body, falling back to English. */
export function localizeGuide<T extends GuideSummary>(
  guide: T,
  locale: Locale,
): {
  title: string;
  excerpt: string | null;
  body: string | null;
  isFallback: boolean;
} {
  const detail = guide as Partial<GuideDetail>;
  if (locale === "ko") {
    const bodyKo = detail.bodyKo?.trim() || null;
    const titleKo = guide.titleKo?.trim() || null;
    return {
      title: titleKo || guide.title,
      excerpt: guide.excerptKo?.trim() || guide.excerpt,
      body: bodyKo || detail.body || null,
      // Only flag a fallback when the reader will actually see an English body.
      isFallback: detail.body !== undefined && !bodyKo,
    };
  }
  return {
    title: guide.title,
    excerpt: guide.excerpt,
    body: detail.body ?? null,
    isFallback: false,
  };
}

/** Words of prose in a guide body (shortcodes and Markdown symbols ignored). */
export function wordCount(body: string | null | undefined): number {
  if (!body) return 0;
  const text = stripShortcodes(body).replace(/[#*_>`\[\]()|!-]/g, " ");
  return text.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

/** Rough reading time in minutes (English ~220 wpm, Korean ~500 chars/min). */
export function readingMinutes(body: string | null | undefined, locale: Locale): number {
  if (!body) return 1;
  const text = stripShortcodes(body).replace(/[#*_>`\[\]()!-]/g, " ");
  if (locale === "ko") {
    return Math.max(1, Math.round(text.replace(/\s+/g, "").length / 500));
  }
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function guideHref(slug: string, locale: Locale): string {
  return locale === "ko" ? `/guides/${slug}?hl=ko` : `/guides/${slug}`;
}

/** `{{product:slug}}` — on its own line or inline; slug chars are limited to slug-safe ones. */
export const PRODUCT_SHORTCODE = /\{\{\s*product:\s*([a-z0-9][a-z0-9-]*)\s*\}\}/gi;

export type GuideSegment =
  | { type: "markdown"; markdown: string }
  | { type: "product"; slug: string };

/** Split a Markdown body into text chunks and product-card placeholders. */
export function splitGuideBody(markdown: string): GuideSegment[] {
  const segments: GuideSegment[] = [];
  let last = 0;
  for (const match of markdown.matchAll(PRODUCT_SHORTCODE)) {
    const index = match.index ?? 0;
    const text = markdown.slice(last, index);
    if (text.trim()) segments.push({ type: "markdown", markdown: text });
    segments.push({ type: "product", slug: match[1].toLowerCase() });
    last = index + match[0].length;
  }
  const tail = markdown.slice(last);
  if (tail.trim()) segments.push({ type: "markdown", markdown: tail });
  return segments;
}

/** Unique product slugs referenced by shortcodes, in order of appearance. */
export function extractProductSlugs(markdown: string): string[] {
  const seen = new Set<string>();
  for (const match of markdown.matchAll(PRODUCT_SHORTCODE)) {
    seen.add(match[1].toLowerCase());
  }
  return [...seen];
}

/** Body with shortcodes removed, for excerpts, meta descriptions and reading time. */
export function stripShortcodes(markdown: string): string {
  return markdown.replace(PRODUCT_SHORTCODE, "").replace(/\n{3,}/g, "\n\n");
}
