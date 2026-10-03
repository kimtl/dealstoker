"use client";

import { useSearchParams } from "next/navigation";
import styles from "./Header.module.css";

type Props = {
  searchLabel: string;
  placeholder: string;
  buttonLabel: string;
};

export function HeaderSearch({
  searchLabel,
  placeholder,
  buttonLabel,
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
      <button className={styles.searchButton} type="submit">
        {buttonLabel}
      </button>
    </form>
  );
}
