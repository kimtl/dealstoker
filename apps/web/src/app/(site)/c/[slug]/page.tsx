import Link from "next/link";
import { notFound } from "next/navigation";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { BuyingGuideModalButton } from "@/components/BuyingGuideModalButton";
import { DealList } from "@/components/DealList";
import { FaqSection } from "@/components/FaqSection";
import { JsonLd } from "@/components/JsonLd";
import { getCategory, getCategoryProducts, getGuides, isApiNotFound } from "@/lib/api";
import { GuideCard } from "@/components/GuideCard";
import type { GuideSummary } from "@/lib/types";
import { getCategoryFaqs } from "@/lib/faq";
import { discountPercentOf, formatMoney } from "@/lib/format";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildItemListJsonLd,
  buildPageMetadata,
  categoryMetaDescription,
  categoryMetaTitle,
} from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { splitIntoParagraphs } from "@/lib/text";
import {
  formatMessage,
  getI18n,
  getLocale,
  localizeCategoryName,
} from "@/lib/i18n";
import styles from "./category.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  try {
    const category = await getCategory(slug);
    const localizedName = localizeCategoryName(category.name, locale);
    return buildPageMetadata({
      title: categoryMetaTitle(category, locale),
      description: categoryMetaDescription(category, locale),
      path: `/c/${slug}`,
      locale,
      keywords:
        locale === "ko"
          ? [
              localizedName,
              `${localizedName} 딜`,
              `아마존 ${localizedName}`,
              "아마존 딜",
              "아마존 할인",
              SITE_NAME,
            ]
          : [
              category.name,
              `best ${category.name} deals`,
              `${category.name} deals`,
              `${category.name} Amazon`,
              "Amazon deals",
              "price drops",
              SITE_NAME,
            ],
    });
  } catch {
    return buildPageMetadata({
      title:
        locale === "ko" ? "아마존 카테고리 딜" : "Amazon Category Deals",
      description:
        locale === "ko"
          ? `${SITE_NAME}에서 Amazon.com 카테고리 딜을 둘러보세요.`
          : `Browse curated Amazon.com category deals on ${SITE_NAME}.`,
      path: `/c/${slug}`,
      locale,
    });
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const sort = query.sort || "newest";
  const page = Math.max(0, Number(query.page || "0") || 0);

  let category;
  try {
    category = await getCategory(slug);
  } catch (error) {
    if (isApiNotFound(error)) {
      notFound();
    }
    throw error;
  }
  // Deactivated categories vanish from nav/sitemap; keep them out of search too.
  if (category.active === false) {
    notFound();
  }

  let products;
  try {
    products = await getCategoryProducts(slug, { sort, page, size: 40 });
  } catch {
    products = {
      items: [],
      page: 0,
      size: 40,
      totalElements: 0,
      totalPages: 0,
    };
  }

  const { locale, t } = await getI18n();
  const localizedName = localizeCategoryName(category.name, locale);

  const sorts = [
    { value: "newest", label: t.newest },
    { value: "price_asc", label: t.priceAsc },
    { value: "price_desc", label: t.priceDesc },
    { value: "discount", label: t.biggestDiscount },
    { value: "rating", label: t.topRated },
  ];

  let guides: GuideSummary[] = [];
  try {
    guides = (await getGuides({ category: slug, size: 6 })).items;
  } catch {
    guides = [];
  }

  const faqs = getCategoryFaqs(category);
  const buyingGuide = category.buyingGuide?.trim() || "";
  const guideParagraphs = splitIntoParagraphs(buyingGuide);
  const seoLead = formatMessage(t.categoryLead, {
    name: localizedName,
    site: SITE_NAME,
  });
  const description = category.description?.trim() || "";
  const leadParagraphs = description
    ? description.toLowerCase().includes("deal")
      ? [description]
      : [seoLead, description]
    : [seoLead];
  const faqJsonLd = buildFaqJsonLd(faqs);

  // "At a glance" card next to the intro, computed over the whole category (not just this page).
  const firstOf = (sortBy: string) =>
    getCategoryProducts(slug, { sort: sortBy, page: 0, size: 1 })
      .then((r) => r.items[0] ?? null)
      .catch(() => null);
  const [cheapest, priciest, biggestDeal] = await Promise.all([
    firstOf("price_asc"),
    firstOf("price_desc"),
    firstOf("discount"),
  ]);
  const discountPercent = discountPercentOf(biggestDeal);
  // Only call out a real saving; tiny markdowns from list prices aren't worth highlighting.
  const showDiscount = biggestDeal != null && discountPercent != null && discountPercent >= 5;
  const minPrice = cheapest ? formatMoney(cheapest.priceAmount, cheapest.currency, locale) : null;
  const maxPrice = priciest ? formatMoney(priciest.priceAmount, priciest.currency, locale) : null;

  const jsonLd = [
    buildBreadcrumbJsonLd([
      { name: t.breadcrumbHome, path: "/" },
      { name: localizedName, path: `/c/${category.slug}` },
    ]),
    buildItemListJsonLd(
      `${localizedName} deals on ${SITE_NAME}`,
      products.items,
      `/c/${category.slug}`,
    ),
    ...(faqJsonLd ? [faqJsonLd] : []),
  ];

  return (
    <main className={styles.main}>
      <JsonLd data={jsonLd} />
      <div className={styles.inner}>
        <nav className={styles.crumbs} aria-label={t.breadcrumb}>
          <Link href="/">{t.frontpage}</Link>
          <span aria-hidden>/</span>
          <span>{localizedName}</span>
        </nav>

        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>{localizedName}</h1>
            {leadParagraphs.map((paragraph, index) => (
              <p key={`lead-${index}`} className={styles.lead}>
                {paragraph}
              </p>
            ))}
            {buyingGuide ? (
              <BuyingGuideModalButton
                categoryName={localizedName}
                buyingGuide={buyingGuide}
                triggerLabel={t.buyingGuide}
                titleLabel={formatMessage(t.buyingGuideTitle, {
                  name: localizedName,
                })}
                closeLabel={t.closeBuyingGuide}
              />
            ) : null}
          </div>
          <aside className={styles.glance} aria-label={t.atAGlance}>
            <p className={styles.glanceTitle}>{t.atAGlance}</p>
            <dl className={styles.glanceList}>
              <div>
                <dt>{t.glanceDeals}</dt>
                <dd>{products.totalElements.toLocaleString(locale === "ko" ? "ko-KR" : "en-US")}</dd>
              </div>
              {minPrice && maxPrice ? (
                <div>
                  <dt>{t.glancePriceRange}</dt>
                  <dd>{minPrice === maxPrice ? minPrice : `${minPrice} – ${maxPrice}`}</dd>
                </div>
              ) : null}
              {showDiscount && biggestDeal ? (
                <div>
                  <dt>{t.glanceBiggestDiscount}</dt>
                  <dd>
                    <Link href={`/p/${biggestDeal.slug}`} className={styles.glanceLink}>
                      {biggestDeal.title}
                    </Link>
                    <span className={styles.glanceDiscount}>-{discountPercent}%</span>
                  </dd>
                </div>
              ) : null}
              {guides.length > 0 ? (
                <div>
                  <dt>{t.glanceGuides}</dt>
                  <dd>
                    <a href="#guides" className={styles.glanceLink}>
                      {formatMessage(guides.length === 1 ? t.guideCount : t.guidesCount, {
                        count: guides.length,
                      })}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          </aside>
          <AffiliateDisclosure className={styles.headerDisclosure} />
        </header>

        <div className={styles.toolbar}>
          <p className={styles.count}>
            {formatMessage(
              products.totalElements === 1 ? t.dealCount : t.dealsCount,
              { count: products.totalElements },
            )}
          </p>
          <div className={styles.sorts} role="navigation" aria-label={t.sortNav}>
            {sorts.map((option) => (
              <Link
                key={option.value}
                href={`/c/${slug}?sort=${option.value}`}
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
          emptyMessage={t.emptyCategory}
        />

        {products.totalPages > 1 ? (
          <nav className={styles.pager} aria-label="Pagination">
            {page > 0 ? (
              <Link href={`/c/${slug}?sort=${sort}&page=${page - 1}`}>
                {t.previous}
              </Link>
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
              <Link href={`/c/${slug}?sort=${sort}&page=${page + 1}`}>
                {t.next}
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}

        {guides.length > 0 ? (
          <section
            id="guides"
            className={styles.guidesSection}
            aria-labelledby="guides-heading"
          >
            <div className={styles.guidesHeader}>
              <h2 id="guides-heading" className={styles.guideTitle}>
                {formatMessage(t.guidesForCategory, { name: localizedName })}
              </h2>
              <Link
                href={locale === "ko" ? "/guides?hl=ko" : "/guides"}
                className={styles.guidesAll}
              >
                {t.allGuides} →
              </Link>
            </div>
            <div className={styles.guidesGrid}>
              {guides.map((guide) => (
                <GuideCard key={guide.id} guide={guide} showCategory={false} />
              ))}
            </div>
          </section>
        ) : null}

        {guideParagraphs.length > 0 ? (
          <section
            id="buying-guide"
            className={styles.guideSection}
            aria-labelledby="buying-guide-heading"
          >
            <h2 id="buying-guide-heading" className={styles.guideTitle}>
              {formatMessage(t.buyingGuideTitle, { name: localizedName })}
            </h2>
            <div className={styles.guideBody}>
              {guideParagraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
              ))}
            </div>
          </section>
        ) : null}

        <FaqSection items={faqs} />
      </div>
    </main>
  );
}
