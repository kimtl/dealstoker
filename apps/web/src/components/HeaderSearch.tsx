"use client";

import { useSearchParams } from "next/navigation";
import styles from "./Header.module.css";

export function HeaderSearch() {
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
        defaultValue={defaultQuery}
        key={defaultQuery}
      />
      <button className={styles.searchButton} type="submit">
        Search
      </button>
    </form>
  );
}
