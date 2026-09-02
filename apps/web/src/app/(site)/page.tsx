import Link from "next/link";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { DealList } from "@/components/DealList";
import { JsonLd } from "@/components/JsonLd";
import { SiteLogo } from "@/components/SiteLogo";
import { getHome, getProducts } from "@/lib/api";
import {
  buildItemListJsonLd,
  buildOrganizationJsonLd,
  buildPageMetadata,
  buildWebSiteJsonLd,
  homeMetaDescription,
  homeMetaTitle,
} from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import type { ProductSummary } from "@/lib/types";
import styles from "./page.module.css";

export const metadata = buildPageMetadata({
  title: homeMetaTitle(),
  description: homeMetaDescription(),
  path: "/",
  keywords: [
    "Amazon deals",
    "best Amazon deals today",
    "Amazon price drops",
    "US Amazon discounts",
    "featured deals",
    SITE_NAME,
  ],
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

  const listedForSchema = [
    ...recommended,
    ...topBuys.filter((p) => !recommended.some((r) => r.id === p.id)),
    ...deals.filter(
      (p) =>
        !recommended.some((r) => r.id === p.id) &&
        !topBuys.some((t) => t.id === p.id),
    ),
  ].slice(0, 20);

  return (
    <main className={styles.main}>
      <JsonLd data={buildOrganizationJsonLd()} />
      <JsonLd data={buildWebSiteJsonLd()} />
      {listedForSchema.length > 0 ? (
        <JsonLd
          data={buildItemListJsonLd(
            `Today's top Amazon deals on ${SITE_NAME}`,
            listedForSchema,
            "/",
          )}
        />
      ) : null}
      <section className={styles.masthead} aria-labelledby="hero-brand">
        <div className={styles.mastheadInner}>
          <div className={styles.brandBlock}>
            <h1 id="hero-brand" className={styles.brand}>
              <span className="sr-only">{SITE_NAME}</span>
              <SiteLogo height={88} priority className={styles.brandLogo} />
            </h1>
            <p className={styles.headline}>Frontpage deals</p>
            <p className={styles.support}>
              Curated Amazon.com picks in a clean deal list — price first, less
              noise.
            </p>
          </div>
          <div className={styles.ctaGroup}>
            <Link href="#featured" className={styles.ctaPrimary}>
              Featured deals
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
            <a href="#featured">Featured</a>
            <a href="#top-buys">Top buys</a>
            <a href="#deal-feed">Latest</a>
          </nav>
          <AffiliateDisclosure className={styles.sideDisclosure} />
        </aside>

        <div className={styles.feedStack}>
          <section
            id="featured"
            className={styles.feed}
            aria-labelledby="featured-heading"
          >
            <div className={styles.feedHeader}>
              <div>
                <h2 id="featured-heading" className={styles.feedTitle}>
                  Featured deals
                </h2>
                <p className={styles.feedMeta}>
                  Featured by DealStoker · up to 5 deals
                </p>
              </div>
              <span className={styles.pill}>Featured</span>
            </div>
            <DealList
              products={recommended}
              showNewBadge={false}
              emptyMessage="No featured deals yet. Mark products as featured in Admin."
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
