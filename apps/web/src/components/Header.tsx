import Link from "next/link";
import { Suspense } from "react";
import { getI18n, localizeCategoryName } from "@/lib/i18n";
import { SITE_NAME } from "@/lib/site";
import type { Category } from "@/lib/types";
import { HeaderSearch } from "./HeaderSearch";
import styles from "./Header.module.css";

type HeaderProps = {
  categories?: Category[];
  compact?: boolean;
};

export async function Header({ categories = [], compact = false }: HeaderProps) {
  const { locale, t } = await getI18n();

  return (
    <header className={`${styles.header} ${compact ? styles.compact : ""}`}>
      <div className={styles.inner}>
        <Link
          href={locale === "ko" ? "/?hl=ko" : "/"}
          className={styles.brand}
          aria-label={`${SITE_NAME} ${t.homeAria}`}
        >
          <span className={styles.mark} aria-hidden />
          <span className={styles.brandText}>{SITE_NAME}</span>
        </Link>

        <Suspense
          fallback={
            <form
              className={styles.search}
              action="/search"
              method="get"
              role="search"
            >
              <label className="sr-only" htmlFor="site-search">
                {t.searchDeals}
              </label>
              <input
                id="site-search"
                className={styles.searchInput}
                type="search"
                name="q"
                placeholder={t.searchPlaceholder}
                autoComplete="off"
                enterKeyHint="search"
              />
              {locale === "ko" ? (
                <input type="hidden" name="hl" value="ko" />
              ) : null}
              <button className={styles.searchButton} type="submit">
                {t.search}
              </button>
            </form>
          }
        >
          <HeaderSearch
            searchLabel={t.searchDeals}
            placeholder={t.searchPlaceholder}
            buttonLabel={t.search}
            locale={locale}
          />
        </Suspense>

        <nav className={styles.nav} aria-label={t.primaryNav}>
          {categories.slice(0, 5).map((category) => (
            <Link
              key={category.id}
              href={
                locale === "ko"
                  ? `/c/${category.slug}?hl=ko`
                  : `/c/${category.slug}`
              }
              className={styles.navLink}
            >
              {localizeCategoryName(category.name, locale)}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
