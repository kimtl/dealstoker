import Link from "next/link";
import { notFound } from "next/navigation";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { BuyingGuideModalButton } from "@/components/BuyingGuideModalButton";
import { DealList } from "@/components/DealList";
import { FaqSection } from "@/components/FaqSection";
import { JsonLd } from "@/components/JsonLd";
import { getCategory, getCategoryProducts } from "@/lib/api";
import { getCategoryFaqs } from "@/lib/faq";
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
  localizeCategoryName,
} from "@/lib/i18n";
import styles from "./category.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const category = await getCategory(slug);
    return buildPageMetadata({
      title: categoryMetaTitle(category),
      description: categoryMetaDescription(category),
      path: `/c/${slug}`,
      keywords: [
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
      title: "Amazon Category Deals",
      description: `Browse curated Amazon.com category deals on ${SITE_NAME}.`,
      path: `/c/${slug}`,
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
  } catch {
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
    { value: "rating", label: t.topRated },
  ];

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
          <AffiliateDisclosure />
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
