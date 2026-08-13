import Link from "next/link";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { ProductCard } from "@/components/ProductCard";
import { getHome } from "@/lib/api";
import { buildMetadata } from "@/lib/metadata";
import { SITE_NAME } from "@/lib/site";
import styles from "./page.module.css";

export const metadata = buildMetadata({
  title: `${SITE_NAME} — Curated Amazon Deals for US Shoppers`,
  description:
    "Hand-picked Amazon.com deals for home, electronics, and outdoor living. Shop smarter with DealStoker.",
  path: "/",
});

export default async function HomePage() {
  let categories: Awaited<ReturnType<typeof getHome>>["categories"] = [];
  let featuredProducts: Awaited<
    ReturnType<typeof getHome>
  >["featuredProducts"] = [];

  try {
    const home = await getHome();
    categories = home.categories ?? [];
    featuredProducts = home.featuredProducts ?? [];
  } catch {
    // API may be offline during build/preview; page still renders.
  }

  return (
    <main>
      <section className={styles.hero} aria-labelledby="hero-brand">
        <div className={styles.heroAtmosphere} aria-hidden />
        <div className={styles.heroInner}>
          <p id="hero-brand" className={styles.brand}>
            {SITE_NAME}
          </p>
          <h1 className={styles.headline}>
            Amazon picks worth the click — curated for US shoppers.
          </h1>
          <p className={styles.support}>
            Practical products across home, electronics, and outdoor gear.
            Fewer tabs. Clearer choices.
          </p>
          <div className={styles.ctaGroup}>
            <Link href="/c/home-kitchen" className={styles.ctaPrimary}>
              Browse deals
            </Link>
            <Link href="/about" className={styles.ctaSecondary}>
              How we curate
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="categories-heading">
        <div className={styles.sectionInner}>
          <h2 id="categories-heading" className={styles.sectionTitle}>
            Shop by category
          </h2>
          <p className={styles.sectionLead}>
            Start with a lane — then dig into the products we actually stand
            behind.
          </p>
          <ul className={styles.categoryList}>
            {categories.length > 0 ? (
              categories.map((category, index) => (
                <li
                  key={category.id}
                  className={styles.categoryItem}
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <Link href={`/c/${category.slug}`}>
                    <span className={styles.categoryName}>{category.name}</span>
                    <span className={styles.categoryDesc}>
                      {category.description}
                    </span>
                  </Link>
                </li>
              ))
            ) : (
              <>
                <li className={styles.categoryItem}>
                  <Link href="/c/home-kitchen">
                    <span className={styles.categoryName}>Home & Kitchen</span>
                    <span className={styles.categoryDesc}>
                      Everyday essentials that earn counter space.
                    </span>
                  </Link>
                </li>
                <li className={styles.categoryItem}>
                  <Link href="/c/electronics">
                    <span className={styles.categoryName}>Electronics</span>
                    <span className={styles.categoryDesc}>
                      Reliable tech with strong ratings and real value.
                    </span>
                  </Link>
                </li>
                <li className={styles.categoryItem}>
                  <Link href="/c/outdoor-sports">
                    <span className={styles.categoryName}>Outdoor & Sports</span>
                    <span className={styles.categoryDesc}>
                      Gear for weekends, workouts, and the trail.
                    </span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </section>

      {featuredProducts.length > 0 ? (
        <section className={styles.section} aria-labelledby="featured-heading">
          <div className={styles.sectionInner}>
            <h2 id="featured-heading" className={styles.sectionTitle}>
              Featured picks
            </h2>
            <p className={styles.sectionLead}>
              Recent curated products live on Amazon.com.
            </p>
            <AffiliateDisclosure className={styles.disclosure} />
            <div className={styles.productGrid}>
              {featuredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
