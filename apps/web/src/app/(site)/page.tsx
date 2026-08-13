import Link from "next/link";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { DealList } from "@/components/DealList";
import { getCategories, getHome, getProducts } from "@/lib/api";
import { buildMetadata } from "@/lib/metadata";
import { SITE_NAME } from "@/lib/site";
import styles from "./page.module.css";

export const metadata = buildMetadata({
  title: `${SITE_NAME} — Frontpage Deals for US Shoppers`,
  description:
    "A Slickdeals-style list of curated Amazon.com deals for home, electronics, and outdoor living.",
  path: "/",
});

export default async function HomePage() {
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let deals: Awaited<ReturnType<typeof getProducts>>["items"] = [];

  try {
    const [home, products] = await Promise.all([
      getHome(),
      getProducts({ sort: "newest", page: 0, size: 40 }),
    ]);
    categories = home.categories ?? [];
    deals = products.items ?? home.featuredProducts ?? [];
  } catch {
    try {
      const home = await getHome();
      categories = home.categories ?? [];
      deals = home.featuredProducts ?? [];
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
            <Link href="#deal-feed" className={styles.ctaPrimary}>
              Jump to deals
            </Link>
            <Link href="/about" className={styles.ctaSecondary}>
              How we curate
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
          <AffiliateDisclosure className={styles.sideDisclosure} />
        </aside>

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
    </main>
  );
}
