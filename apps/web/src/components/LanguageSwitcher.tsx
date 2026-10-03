"use client";

import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/locale";
import type { Messages } from "@/lib/i18n/messages";
import styles from "./LanguageSwitcher.module.css";

type Props = {
  locale: Locale;
  t: Pick<Messages, "language" | "languageEn" | "languageKo">;
};

export function LanguageSwitcher({ locale, t }: Props) {
  const pathname = usePathname() || "/";

  return (
    <div className={styles.wrap} aria-label={t.language}>
      <span className={styles.label}>{t.language}</span>
      <form className={styles.form} action="/api/locale" method="post">
        <input type="hidden" name="redirect" value={pathname} />
        <button
          type="submit"
          name="locale"
          value="en"
          className={locale === "en" ? styles.active : styles.button}
          aria-pressed={locale === "en"}
        >
          {t.languageEn}
        </button>
        <button
          type="submit"
          name="locale"
          value="ko"
          className={locale === "ko" ? styles.active : styles.button}
          aria-pressed={locale === "ko"}
        >
          {t.languageKo}
        </button>
      </form>
    </div>
  );
}
