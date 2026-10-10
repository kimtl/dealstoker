import type { Locale } from "@/lib/i18n/locale";

function intlLocale(locale?: Locale | null): string {
  return locale === "ko" ? "ko-KR" : "en-US";
}

export function formatMoney(
  amount: number | string | null | undefined,
  currency: string | null | undefined = "USD",
  locale?: Locale | null,
): string | null {
  if (amount === null || amount === undefined || amount === "") {
    return null;
  }
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(value)) {
    return null;
  }
  try {
    return new Intl.NumberFormat(intlLocale(locale), {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

export function formatRating(
  rating: number | string | null | undefined,
): string | null {
  if (rating === null || rating === undefined || rating === "") {
    return null;
  }
  const value = typeof rating === "string" ? Number(rating) : rating;
  if (Number.isNaN(value)) {
    return null;
  }
  return value.toFixed(1);
}

export function formatReviewCount(
  count: number | null | undefined,
  locale?: Locale | null,
): string {
  if (count === null || count === undefined) {
    return "";
  }
  return new Intl.NumberFormat(intlLocale(locale)).format(count);
}

/**
 * Times are shown in US Eastern time (most of our shoppers and Amazon.com deal timing are
 * US-based). The abbreviation follows daylight saving: EDT in summer, EST in winter.
 */
export const SITE_TIME_ZONE = "America/New_York";

/** "EDT" or "EST" for the given instant. */
export function siteTimeZoneAbbr(date: Date): string {
  const part = new Intl.DateTimeFormat("en-US", {
    timeZone: SITE_TIME_ZONE,
    timeZoneName: "short",
  })
    .formatToParts(date)
    .find((p) => p.type === "timeZoneName");
  return part?.value ?? "ET";
}

/** e.g. "Oct 2, 2026, 6:30 PM EDT" / "2026. 10. 2. 오후 6:30 EDT" */
export function formatUpdatedAt(
  value: string | null | undefined,
  locale?: Locale | null,
): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  try {
    const formatted = new Intl.DateTimeFormat(intlLocale(locale), {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: SITE_TIME_ZONE,
    }).format(date);
    // Korean Intl output would say "GMT-4"; use the same EDT/EST label in every language.
    return `${formatted} ${siteTimeZoneAbbr(date)}`;
  } catch {
    return date.toISOString();
  }
}

/** Prices older than this are flagged as possibly changed (daily refresh + slack). */
export const PRICE_STALE_HOURS = 36;

/** True when the price check time is missing or older than {@link PRICE_STALE_HOURS}. */
export function isPriceStale(
  checkedAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!checkedAt) return true;
  const time = new Date(checkedAt).getTime();
  if (Number.isNaN(time)) return true;
  return now.getTime() - time > PRICE_STALE_HOURS * 60 * 60 * 1000;
}

/** Whole-percent saving vs. list price, or null when there is no real list-price discount. */
export function discountPercentOf(
  product: { priceAmount?: number | string | null; listPrice?: number | string | null } | null,
): number | null {
  if (!product || product.priceAmount == null || product.listPrice == null) return null;
  const price = Number(product.priceAmount);
  const list = Number(product.listPrice);
  if (!Number.isFinite(price) || !Number.isFinite(list) || list <= 0 || price >= list) return null;
  return Math.round(((list - price) / list) * 100);
}

/** "2026-10-04" (a calendar day, no time) as "Oct 4, 2026" / "2026년 10월 4일". */
export function formatCalendarDate(
  isoDate: string | null | undefined,
  locale?: Locale | null,
): string | null {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const date = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
