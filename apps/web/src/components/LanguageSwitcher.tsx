"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/i18n/locale";
import { withLocaleQuery } from "@/lib/i18n/locale";
import type { Messages } from "@/lib/i18n/messages";
import styles from "./LanguageSwitcher.module.css";

type Props = {
  locale: Locale;
  t: Pick<Messages, "language" | "languageEn" | "languageKo">;
};

export function LanguageSwitcher({ locale, t }: Props) {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const search = searchParams?.toString() || "";

  return (
    <div className={styles.wrap} aria-label={t.language}>
      <span className={styles.label}>{t.language}</span>
      <div className={styles.form} role="group">
        <Link
          href={withLocaleQuery(pathname, search, "en")}
          className={locale === "en" ? styles.active : styles.button}
          hrefLang="en"
          aria-current={locale === "en" ? "true" : undefined}
        >
          {t.languageEn}
        </Link>
        <Link
          href={withLocaleQuery(pathname, search, "ko")}
          className={locale === "ko" ? styles.active : styles.button}
          hrefLang="ko"
          aria-current={locale === "ko" ? "true" : undefined}
        >
          {t.languageKo}
        </Link>
      </div>
    </div>
  );
}
