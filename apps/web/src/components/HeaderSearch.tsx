"use client";

import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/i18n/locale";
import styles from "./Header.module.css";

type Props = {
  searchLabel: string;
  placeholder: string;
  buttonLabel: string;
  locale?: Locale;
};

export function HeaderSearch({
  searchLabel,
  placeholder,
  buttonLabel,
  locale = "en",
}: Props) {
  const searchParams = useSearchParams();
  const defaultQuery = searchParams.get("q") || "";

  return (
    <form
      className={styles.search}
      action="/search"
      method="get"
      role="search"
    >
      <label className="sr-only" htmlFor="site-search">
        {searchLabel}
      </label>
      <input
        id="site-search"
        className={styles.searchInput}
        type="search"
        name="q"
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
        defaultValue={defaultQuery}
        key={defaultQuery}
      />
      {locale === "ko" ? <input type="hidden" name="hl" value="ko" /> : null}
      <button className={styles.searchButton} type="submit">
        {buttonLabel}
      </button>
    </form>
  );
}
