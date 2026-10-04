import type { Metadata } from "next";
import Link from "next/link";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { DealList } from "@/components/DealList";
import { JsonLd } from "@/components/JsonLd";
import { getGuides, getHome, getProducts } from "@/lib/api";
import { GuideCard } from "@/components/GuideCard";
import type { GuideSummary } from "@/lib/types";
import { formatMessage, getI18n, getLocale, localizeCategoryName } from "@/lib/i18n";
import {
  buildItemListJsonLd,
  buildOrganizationJsonLd,
  buildPageMetadata,
  buildWebSiteJsonLd,
  homeMetaDescription,
  homeMetaKeywords,
  homeMetaTitle,
} from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import type { ProductSummary } from "@/lib/types";
import styles from "./page.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    ...buildPageMetadata({
      title: homeMetaTitle(locale),
      description: homeMetaDescription(locale),
      path: "/",
      keywords: homeMetaKeywords(locale),
      locale,
    }),
    verification: {
      other: {
        "naver-site-verification":
          "c38cadddf7da4068cc32a9a3c931c50c07279b30",
      },
    },
  };
}

export default async function HomePage() {
  const { locale, t } = await getI18n();
  let categories: Awaited<ReturnType<typeof getHome>>["categories"] = [];
  let recommended: ProductSummary[] = [];
  let topViews: ProductSummary[] = [];
  let deals: ProductSummary[] = [];

  try {
    const [home, products] = await Promise.all([
      getHome(),
      getProducts({ sort: "newest", page: 0, size: 40 }),
    ]);
    categories = home.categories ?? [];
    recommended = home.recommendedDeals ?? [];
    topViews = home.topViewDeals ?? home.topBuyDeals ?? [];
    deals = home.latestDeals ?? products.items ?? home.featuredProducts ?? [];
  } catch {
    try {
      const home = await getHome();
      categories = home.categories ?? [];
      recommended = home.recommendedDeals ?? [];
      topViews = home.topViewDeals ?? home.topBuyDeals ?? [];
      deals = home.latestDeals ?? home.featuredProducts ?? [];
    } catch {
      // API may be offline during build/preview.
    }
  }

  let guides: GuideSummary[] = [];
  try {
    guides = (await getGuides({ size: 3 })).items;
  } catch {
    guides = [];
  }

  const listedForSchema = [
    ...recommended,
    ...topViews.filter((p) => !recommended.some((r) => r.id === p.id)),
    ...deals.filter(
      (p) =>
        !recommended.some((r) => r.id === p.id) &&
        !topViews.some((t) => t.id === p.id),
    ),
  ].slice(0, 20);

  const fallbackCategories = [
    { id: 1, slug: "home-kitchen", name: "Home & Kitchen" },
    { id: 2, slug: "electronics", name: "Electronics" },
    { id: 3, slug: "outdoor-sports", name: "Outdoor & Sports" },
  ];

  return (
    <main className={styles.main}>
      <JsonLd data={buildOrganizationJsonLd(locale)} />
      <JsonLd data={buildWebSiteJsonLd(locale)} />
      {listedForSchema.length > 0 ? (
        <JsonLd
          data={buildItemListJsonLd(
            locale === "ko"
              ? `${SITE_NAME} 오늘의 아마존 딜`
              : `Today's top Amazon deals on ${SITE_NAME}`,
            listedForSchema,
            "/",
          )}
        />
      ) : null}
      <section className={styles.masthead} aria-labelledby="hero-brand">
        <div className={styles.mastheadInner}>
          <div className={styles.brandBlock}>
            <p id="hero-brand" className={styles.brand}>
              {SITE_NAME}
            </p>
            <h1 className={styles.headline}>{t.homeHeadline}</h1>
            <p className={styles.support}>{t.homeSupport}</p>
          </div>
          <div className={styles.ctaGroup}>
            <Link href="#featured" className={styles.ctaPrimary}>
              {t.featuredDeals}
            </Link>
            <Link href="#deal-feed" className={styles.ctaSecondary}>
              {t.allDeals}
            </Link>
          </div>
        </div>
      </section>

      <div className={styles.shell}>
        <aside className={styles.sidebar} aria-label={t.categories}>
          <h2 className={styles.sideTitle}>{t.categories}</h2>
          <ul className={styles.catList}>
            {(categories.length > 0 ? categories : fallbackCategories).map(
              (category) => (
                <li key={category.id}>
                  <Link href={`/c/${category.slug}`}>
                    {localizeCategoryName(category.name, locale)}
                  </Link>
                </li>
              ),
            )}
          </ul>
          <nav className={styles.jumpNav} aria-label={t.frontpageSections}>
            <a href="#featured">{t.featured}</a>
            <a href="#top-views">{t.topViews}</a>
            <a href="#deal-feed">{t.latestDeals}</a>
          </nav>
          <AffiliateDisclosure className={styles.sideDisclosure} />
        </aside>

        <div className={styles.feedStack}>
          <section className={styles.intro} aria-label={t.about}>
            <p>{formatMessage(t.homeIntro1, { site: SITE_NAME })}</p>
            <p>{t.homeIntro2}</p>
          </section>

          <section
            id="featured"
            className={styles.feed}
            aria-labelledby="featured-heading"
          >
            <div className={styles.feedHeader}>
              <div>
                <h2 id="featured-heading" className={styles.feedTitle}>
                  {t.featuredDeals}
                </h2>
                <p className={styles.feedMeta}>{t.featuredMeta}</p>
              </div>
              <span className={styles.pill}>{t.featured}</span>
            </div>
            <DealList
              products={recommended}
              showNewBadge={false}
              emptyMessage={t.emptyFeatured}
            />
          </section>

          <section
            id="top-views"
            className={styles.feed}
            aria-labelledby="top-views-heading"
          >
            <div className={styles.feedHeader}>
              <div>
                <h2 id="top-views-heading" className={styles.feedTitle}>
                  {t.topViews}
                </h2>
                <p className={styles.feedMeta}>{t.topViewsMeta}</p>
              </div>
              <span className={styles.pillHot}>{t.trending}</span>
            </div>
            <DealList
              products={topViews}
              showNewBadge={false}
              showViewRank
              emptyMessage={t.emptyTopViews}
            />
          </section>

          {guides.length > 0 ? (
            <section
              id="guides"
              className={styles.feed}
              aria-labelledby="guides-heading"
            >
              <div className={styles.feedHeader}>
                <div>
                  <h2 id="guides-heading" className={styles.feedTitle}>
                    {t.latestGuides}
                  </h2>
                  <p className={styles.feedMeta}>{t.latestGuidesMeta}</p>
                </div>
                <Link
                  href={locale === "ko" ? "/guides?hl=ko" : "/guides"}
                  className={styles.feedMore}
                >
                  {t.allGuides} →
                </Link>
              </div>
              <div className={styles.guideGrid}>
                {guides.map((guide) => (
                  <GuideCard key={guide.id} guide={guide} />
                ))}
              </div>
            </section>
          ) : null}

          <section
            id="deal-feed"
            className={styles.feed}
            aria-labelledby="feed-heading"
          >
            <div className={styles.feedHeader}>
              <div>
                <h2 id="feed-heading" className={styles.feedTitle}>
                  {t.latestDeals}
                </h2>
                <p className={styles.feedMeta}>
                  {formatMessage(t.latestMeta, {
                    count: deals.length,
                    suffix: deals.length === 1 ? t.livePick : t.livePicks,
                  })}
                </p>
              </div>
              <span className={styles.live}>
                <span className={styles.liveDot} aria-hidden />
                {t.updated}
              </span>
            </div>
            <DealList products={deals} emptyMessage={t.emptyLatest} />
          </section>
        </div>
      </div>
    </main>
  );
}
