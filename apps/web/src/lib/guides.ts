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

/** Rough reading time in minutes (English ~220 wpm, Korean ~500 chars/min). */
export function readingMinutes(body: string | null | undefined, locale: Locale): number {
  if (!body) return 1;
  const text = body.replace(/[#*_>`\[\]()!-]/g, " ");
  if (locale === "ko") {
    return Math.max(1, Math.round(text.replace(/\s+/g, "").length / 500));
  }
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function guideHref(slug: string, locale: Locale): string {
  return locale === "ko" ? `/guides/${slug}?hl=ko` : `/guides/${slug}`;
}
