import Link from "next/link";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { DealList } from "@/components/DealList";
import { getHome, getProducts } from "@/lib/api";
import { buildMetadata } from "@/lib/metadata";
import { SITE_NAME } from "@/lib/site";
import type { ProductSummary } from "@/lib/types";
import styles from "./page.module.css";

export const metadata = buildMetadata({
  title: `${SITE_NAME} — Frontpage Deals for US Shoppers`,
  description:
    "A Slickdeals-style list of curated Amazon.com deals for home, electronics, and outdoor living.",
  path: "/",
});

export default async function HomePage() {
  let categories: Awaited<ReturnType<typeof getHome>>["categories"] = [];
  let recommended: ProductSummary[] = [];
  let topBuys: ProductSummary[] = [];
  let deals: ProductSummary[] = [];

  try {
    const [home, products] = await Promise.all([
      getHome(),
      getProducts({ sort: "newest", page: 0, size: 40 }),
    ]);
    categories = home.categories ?? [];
    recommended = home.recommendedDeals ?? [];
    topBuys = home.topBuyDeals ?? [];
    deals = home.latestDeals ?? products.items ?? home.featuredProducts ?? [];
  } catch {
    try {
      const home = await getHome();
      categories = home.categories ?? [];
      recommended = home.recommendedDeals ?? [];
      topBuys = home.topBuyDeals ?? [];
      deals = home.latestDeals ?? home.featuredProducts ?? [];
    } catch {
      // API may be offline during build/preview.
    }
  }

  return (
    <main className={styles.main}>
      <section className={styles.masthead} aria-labelledby="hero-brand">
        <div className={styles.mastheadInner}>
          <div className={styles.brandBlock}>
            <p id="hero-brand" className={styles.brand}>
              {SITE_NAME}
            </p>
            <h1 className={styles.headline}>Frontpage deals</h1>
            <p className={styles.support}>
              Curated Amazon.com picks in a clean deal list — price first, less
              noise.
            </p>
          </div>
          <div className={styles.ctaGroup}>
            <Link href="#recommended" className={styles.ctaPrimary}>
              Staff picks
            </Link>
            <Link href="#deal-feed" className={styles.ctaSecondary}>
              All deals
            </Link>
          </div>
        </div>
      </section>

      <div className={styles.shell}>
        <aside className={styles.sidebar} aria-label="Categories">
          <h2 className={styles.sideTitle}>Categories</h2>
          <ul className={styles.catList}>
            {(categories.length > 0
              ? categories
              : [
                  {
                    id: 1,
                    slug: "home-kitchen",
                    name: "Home & Kitchen",
                  },
                  {
                    id: 2,
                    slug: "electronics",
                    name: "Electronics",
                  },
                  {
                    id: 3,
                    slug: "outdoor-sports",
                    name: "Outdoor & Sports",
                  },
                ]
            ).map((category) => (
              <li key={category.id}>
                <Link href={`/c/${category.slug}`}>{category.name}</Link>
              </li>
            ))}
          </ul>
          <nav className={styles.jumpNav} aria-label="Frontpage sections">
            <a href="#recommended">Recommended</a>
            <a href="#top-buys">Top buys</a>
            <a href="#deal-feed">Latest</a>
          </nav>
          <AffiliateDisclosure className={styles.sideDisclosure} />
        </aside>

        <div className={styles.feedStack}>
          <section
            id="recommended"
            className={styles.feed}
            aria-labelledby="recommended-heading"
          >
            <div className={styles.feedHeader}>
              <div>
                <h2 id="recommended-heading" className={styles.feedTitle}>
                  Staff recommended
                </h2>
                <p className={styles.feedMeta}>
                  Hand-picked by DealStoker · up to 5 deals
                </p>
              </div>
              <span className={styles.pill}>Curated</span>
            </div>
            <DealList
              products={recommended}
              showNewBadge={false}
              emptyMessage="No recommended deals yet. Mark products as featured in Admin."
            />
          </section>

          <section
            id="top-buys"
            className={styles.feed}
            aria-labelledby="top-buys-heading"
          >
            <div className={styles.feedHeader}>
              <div>
                <h2 id="top-buys-heading" className={styles.feedTitle}>
                  Top buys
                </h2>
                <p className={styles.feedMeta}>
                  Most /go click-throughs · top 5
                </p>
              </div>
              <span className={styles.pillHot}>Trending</span>
            </div>
            <DealList
              products={topBuys}
              showNewBadge={false}
              showBuyRank
              emptyMessage="No buy clicks yet. Rankings appear after shoppers use View on Amazon."
            />
          </section>

          <section
            id="deal-feed"
            className={styles.feed}
            aria-labelledby="feed-heading"
          >
            <div className={styles.feedHeader}>
              <div>
                <h2 id="feed-heading" className={styles.feedTitle}>
                  Latest deals
                </h2>
                <p className={styles.feedMeta}>
                  {deals.length} live pick{deals.length === 1 ? "" : "s"} · Amazon
                </p>
              </div>
              <span className={styles.live}>
                <span className={styles.liveDot} aria-hidden />
                Updated
              </span>
            </div>
            <DealList
              products={deals}
              emptyMessage="No published deals yet. Check back soon."
            />
          </section>
        </div>
      </div>
    </main>
  );
}
