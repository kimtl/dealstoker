export type Locale = "en" | "ko";

export const LOCALES: Locale[] = ["en", "ko"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "ds_locale";
export const LOCALE_HEADER = "x-dealstoker-locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "ko";
}

/**
 * Prefer an explicit cookie (user choice), otherwise Accept-Language.
 * Korean tags (`ko`, `ko-KR`, …) map to `ko`.
 */
export function detectLocale(
  acceptLanguage: string | null | undefined,
  cookieLocale: string | null | undefined,
): Locale {
  if (isLocale(cookieLocale)) return cookieLocale;
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const parts = acceptLanguage.split(",").map((part) => part.trim().toLowerCase());
  for (const part of parts) {
    const tag = part.split(";")[0]?.trim() || "";
    if (tag === "ko" || tag.startsWith("ko-")) return "ko";
  }
  return DEFAULT_LOCALE;
}
