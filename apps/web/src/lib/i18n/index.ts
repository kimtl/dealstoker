import { cookies, headers } from "next/headers";
import {
  dictionaries,
  formatMessage,
  localizeCategoryName,
  type Messages,
} from "./messages";
import {
  DEFAULT_LOCALE,
  detectLocale,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  LOCALE_QUERY,
  localizedAbsoluteUrl,
  ogLocale,
  schemaLanguage,
  withLocaleQuery,
  type Locale,
} from "./locale";

export type { Locale, Messages };
export {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_QUERY,
  detectLocale,
  formatMessage,
  localizeCategoryName,
  localizedAbsoluteUrl,
  ogLocale,
  schemaLanguage,
  withLocaleQuery,
};

export async function getLocale(): Promise<Locale> {
  const headerStore = await headers();
  const fromMiddleware = headerStore.get(LOCALE_HEADER);
  if (fromMiddleware === "en" || fromMiddleware === "ko") {
    return fromMiddleware;
  }

  const jar = await cookies();
  return detectLocale(
    headerStore.get("accept-language"),
    jar.get(LOCALE_COOKIE)?.value,
    null,
  );
}

export async function getMessages(): Promise<Messages> {
  const locale = await getLocale();
  return dictionaries[locale];
}

export async function getI18n(): Promise<{
  locale: Locale;
  t: Messages;
}> {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
