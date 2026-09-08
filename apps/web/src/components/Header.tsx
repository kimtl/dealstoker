import Link from "next/link";
import { Suspense } from "react";
import { SITE_NAME } from "@/lib/site";
import type { Category } from "@/lib/types";
import { HeaderSearch } from "./HeaderSearch";
import styles from "./Header.module.css";

type HeaderProps = {
  categories?: Category[];
  compact?: boolean;
};

function SearchFallback() {
  return (
    <form
      className={styles.search}
      action="/search"
      method="get"
      role="search"
    >
      <label className="sr-only" htmlFor="site-search">
        Search deals
      </label>
      <input
        id="site-search"
        className={styles.searchInput}
        type="search"
        name="q"
        placeholder="Search deals…"
        autoComplete="off"
        enterKeyHint="search"
      />
      <button className={styles.searchButton} type="submit">
        Search
      </button>
    </form>
  );
}

export function Header({ categories = [], compact = false }: HeaderProps) {
  const activeCategories = categories.filter(
    (category) => category.active !== false,
  );

  return (
    <header className={`${styles.header} ${compact ? styles.compact : ""}`}>
      <div className={styles.inner}>
        <div className={styles.topRow}>
          <Link
            href="/"
            className={styles.brand}
            aria-label={`${SITE_NAME} home`}
          >
            <span className={styles.mark} aria-hidden />
            <span className={styles.brandText}>{SITE_NAME}</span>
          </Link>

          <Suspense fallback={<SearchFallback />}>
            <HeaderSearch />
          </Suspense>
        </div>

        {activeCategories.length > 0 ? (
          <nav className={styles.nav} aria-label="Categories">
            {activeCategories.map((category) => (
              <Link
                key={category.id}
                href={`/c/${category.slug}`}
                className={styles.navLink}
              >
                {category.name}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
