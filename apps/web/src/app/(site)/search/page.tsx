import Link from "next/link";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { DealList } from "@/components/DealList";
import { getProducts } from "@/lib/api";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import styles from "./search.module.css";

type PageProps = {
  searchParams: Promise<{ q?: string; sort?: string; page?: string }>;
};

function normalizeQuery(raw: string | undefined): string {
  return (raw || "").trim().slice(0, 120);
}

export async function generateMetadata({ searchParams }: PageProps) {
  const query = await searchParams;
  const q = normalizeQuery(query.q);
  if (!q) {
    return buildPageMetadata({
      title: `Search Amazon deals | ${SITE_NAME}`,
      description: `Search curated Amazon.com deals on ${SITE_NAME}. Find products by name or brand.`,
      path: "/search",
    });
  }
  return buildPageMetadata({
    title: `Search “${q}” | ${SITE_NAME}`,
    description: `Amazon deals matching “${q}” on ${SITE_NAME}. Compare prices, ratings, and featured picks.`,
    path: `/search?q=${encodeURIComponent(q)}`,
  });
}

export default async function SearchPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const q = normalizeQuery(query.q);
  const sort = query.sort || "newest";
  const page = Math.max(0, Number(query.page || "0") || 0);

  const sorts = [
    { value: "newest", label: "Newest" },
    { value: "price_asc", label: "Price ↑" },
    { value: "price_desc", label: "Price ↓" },
    { value: "rating", label: "Top rated" },
  ];

  let products = {
    items: [] as Awaited<ReturnType<typeof getProducts>>["items"],
    page: 0,
    size: 40,
    totalElements: 0,
    totalPages: 0,
  };

  if (q) {
    try {
      products = await getProducts({ q, sort, page, size: 40 });
    } catch {
      // keep empty fallback
    }
  }

  function hrefFor(next: { sort?: string; page?: number }) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("sort", next.sort || sort);
    if ((next.page ?? page) > 0) {
      params.set("page", String(next.page ?? page));
    }
    return `/search?${params.toString()}`;
  }

  return (
    <main className={styles.main}>
      <div className={styles.inner}>
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden>/</span>
          <span>Search</span>
        </nav>

        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>
              {q ? `Results for “${q}”` : "Search deals"}
            </h1>
            <p className={styles.lead}>
              {q
                ? `Browse curated Amazon.com deals matching your search on ${SITE_NAME}.`
                : `Type a product name or brand in the search box above to find deals on ${SITE_NAME}.`}
            </p>
          </div>
          <AffiliateDisclosure />
        </header>

        {!q ? (
          <form className={styles.emptySearch} action="/search" method="get" role="search">
            <label className="sr-only" htmlFor="search-page-q">
              Search deals
            </label>
            <input
              id="search-page-q"
              className={styles.emptyInput}
              type="search"
              name="q"
              placeholder="Try Instant Pot, Anker, AirTag…"
              autoComplete="off"
              autoFocus
            />
            <button className={styles.emptyButton} type="submit">
              Search
            </button>
          </form>
        ) : (
          <>
            <div className={styles.toolbar}>
              <p className={styles.count}>
                {products.totalElements} result
                {products.totalElements === 1 ? "" : "s"}
              </p>
              <div className={styles.sorts} role="navigation" aria-label="Sort">
                {sorts.map((option) => (
                  <Link
                    key={option.value}
                    href={hrefFor({ sort: option.value, page: 0 })}
                    className={
                      sort === option.value ? styles.sortActive : styles.sortLink
                    }
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </div>

            <DealList
              products={products.items}
              emptyMessage={`No deals matched “${q}”. Try another product name or brand.`}
            />

            {products.totalPages > 1 ? (
              <nav className={styles.pager} aria-label="Pagination">
                {page > 0 ? (
                  <Link href={hrefFor({ page: page - 1 })}>Previous</Link>
                ) : (
                  <span />
                )}
                <span>
                  Page {page + 1} of {products.totalPages}
                </span>
                {page + 1 < products.totalPages ? (
                  <Link href={hrefFor({ page: page + 1 })}>Next</Link>
                ) : (
                  <span />
                )}
              </nav>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
