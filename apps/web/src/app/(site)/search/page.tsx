import Link from "next/link";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { DealList } from "@/components/DealList";
import { getCategories, getProducts } from "@/lib/api";
import { formatMessage, getI18n, localizeCategoryName } from "@/lib/i18n";
import { buildPageMetadata } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import styles from "./search.module.css";

type SearchQuery = {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
};

type PageProps = {
  searchParams: Promise<SearchQuery>;
};

function normalizeQuery(raw: string | undefined): string {
  return (raw || "").trim().slice(0, 120);
}

function normalizeCategory(raw: string | undefined): string {
  return (raw || "").trim().slice(0, 120);
}

function normalizePrice(raw: string | undefined): string {
  const value = (raw || "").trim();
  if (!value) return "";
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return "";
  return String(Math.min(n, 1_000_000));
}

function hasActiveFilters(input: {
  q: string;
  category: string;
  minPrice: string;
  maxPrice: string;
}): boolean {
  return Boolean(input.q || input.category || input.minPrice || input.maxPrice);
}

export async function generateMetadata({ searchParams }: PageProps) {
  const query = await searchParams;
  const q = normalizeQuery(query.q);
  if (!q) {
    return buildPageMetadata({
      title: `Search Amazon deals | ${SITE_NAME}`,
      description: `Search curated Amazon.com deals on ${SITE_NAME}. Filter by category and price.`,
      path: "/search",
    });
  }
  return buildPageMetadata({
    title: `Search “${q}” | ${SITE_NAME}`,
    description: `Amazon deals matching “${q}” on ${SITE_NAME}. Filter by category and price.`,
    path: `/search?q=${encodeURIComponent(q)}`,
  });
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { locale, t } = await getI18n();
  const query = await searchParams;
  const q = normalizeQuery(query.q);
  const category = normalizeCategory(query.category);
  const minPrice = normalizePrice(query.minPrice);
  const maxPrice = normalizePrice(query.maxPrice);
  const sort = query.sort || "newest";
  const page = Math.max(0, Number(query.page || "0") || 0);
  const active = hasActiveFilters({ q, category, minPrice, maxPrice });

  const sorts = [
    { value: "newest", label: t.newest },
    { value: "price_asc", label: t.priceAsc },
    { value: "price_desc", label: t.priceDesc },
    { value: "rating", label: t.topRated },
  ];

  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  try {
    categories = await getCategories();
  } catch {
    categories = [];
  }

  let products = {
    items: [] as Awaited<ReturnType<typeof getProducts>>["items"],
    page: 0,
    size: 40,
    totalElements: 0,
    totalPages: 0,
  };

  if (active) {
    try {
      products = await getProducts({
        q: q || undefined,
        category: category || undefined,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        sort,
        page,
        size: 40,
      });
    } catch {
      // keep empty fallback
    }
  }

  function hrefFor(next: { sort?: string; page?: number }) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    params.set("sort", next.sort || sort);
    if ((next.page ?? page) > 0) {
      params.set("page", String(next.page ?? page));
    }
    return `/search?${params.toString()}`;
  }

  const categoryNameRaw =
    categories.find((item) => item.slug === category)?.name || category;
  const categoryName = localizeCategoryName(categoryNameRaw, locale);

  const title = q
    ? formatMessage(t.resultsForQ, { q })
    : category
      ? formatMessage(t.categoryDealsTitle, { name: categoryName })
      : minPrice || maxPrice
        ? t.filteredDeals
        : t.searchPageTitle;

  const lead = active
    ? formatMessage(t.searchActiveLead, { site: SITE_NAME })
    : formatMessage(t.searchPageLead, { site: SITE_NAME });

  const resultLabel =
    products.totalElements === 1
      ? formatMessage(t.resultOne, { count: products.totalElements })
      : formatMessage(t.resultMany, { count: products.totalElements });

  return (
    <main className={styles.main}>
      <div className={styles.inner}>
        <nav className={styles.crumbs} aria-label={t.breadcrumb}>
          <Link href="/">{t.breadcrumbHome}</Link>
          <span aria-hidden>/</span>
          <span>{t.search}</span>
        </nav>

        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.lead}>{lead}</p>
          </div>
          <AffiliateDisclosure />
        </header>

        <form
          key={`${q}|${category}|${minPrice}|${maxPrice}|${sort}`}
          className={styles.filters}
          action="/search"
          method="get"
        >
          <div className={styles.filterField}>
            <label htmlFor="search-q">{t.keywords}</label>
            <input
              id="search-q"
              type="search"
              name="q"
              defaultValue={q}
              placeholder={t.productOrBrand}
              autoComplete="off"
            />
          </div>

          <div className={styles.filterField}>
            <label htmlFor="search-category">{t.category}</label>
            <select
              id="search-category"
              name="category"
              defaultValue={category}
            >
              <option value="">{t.allCategories}</option>
              {categories.map((item) => (
                <option key={item.id} value={item.slug}>
                  {localizeCategoryName(item.name, locale)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterField}>
            <label htmlFor="search-min-price">{t.minPrice} ($)</label>
            <input
              id="search-min-price"
              type="number"
              name="minPrice"
              min={0}
              step="1"
              inputMode="decimal"
              defaultValue={minPrice}
              placeholder="0"
            />
          </div>

          <div className={styles.filterField}>
            <label htmlFor="search-max-price">{t.maxPrice} ($)</label>
            <input
              id="search-max-price"
              type="number"
              name="maxPrice"
              min={0}
              step="1"
              inputMode="decimal"
              defaultValue={maxPrice}
              placeholder={t.anyPrice}
            />
          </div>

          <div className={styles.filterField}>
            <label htmlFor="search-sort">{t.sortNav}</label>
            <select id="search-sort" name="sort" defaultValue={sort}>
              {sorts.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterActions}>
            <button className={styles.applyButton} type="submit">
              {t.applyFilters}
            </button>
            <Link className={styles.clearLink} href="/search">
              {t.clearFilters}
            </Link>
          </div>
        </form>

        {active ? (
          <>
            <div className={styles.toolbar}>
              <p className={styles.count}>{resultLabel}</p>
              <div
                className={styles.sorts}
                role="navigation"
                aria-label={t.sortNav}
              >
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

            <DealList products={products.items} emptyMessage={t.searchEmpty} />

            {products.totalPages > 1 ? (
              <nav className={styles.pager} aria-label="Pagination">
                {page > 0 ? (
                  <Link href={hrefFor({ page: page - 1 })}>{t.previous}</Link>
                ) : (
                  <span />
                )}
                <span>
                  {formatMessage(t.pageOf, {
                    page: page + 1,
                    total: products.totalPages,
                  })}
                </span>
                {page + 1 < products.totalPages ? (
                  <Link href={hrefFor({ page: page + 1 })}>{t.next}</Link>
                ) : (
                  <span />
                )}
              </nav>
            ) : null}
          </>
        ) : (
          <p className={styles.hint}>{t.searchHint}</p>
        )}
      </div>
    </main>
  );
}
