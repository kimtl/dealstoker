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

/** e.g. "Oct 2, 2026, 10:30 PM UTC" / "2026. 10. 2. 오후 10:30 UTC" */
export function formatUpdatedAt(
  value: string | null | undefined,
  locale?: Locale | null,
): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  try {
    return new Intl.DateTimeFormat(intlLocale(locale), {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
      timeZoneName: "short",
    }).format(date);
  } catch {
    return date.toISOString();
  }
}
