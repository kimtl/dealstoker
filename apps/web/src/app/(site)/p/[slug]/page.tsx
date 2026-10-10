import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { DealList } from "@/components/DealList";
import { FaqSection } from "@/components/FaqSection";
import { JsonLd } from "@/components/JsonLd";
import { getGuides, getPriceHistory, getProduct, getRelatedProducts, isApiNotFound } from "@/lib/api";
import { PriceHistoryPanel } from "@/components/PriceHistoryPanel";
import { GuideCard } from "@/components/GuideCard";
import type { GuideSummary, PriceHistory } from "@/lib/types";
import { getProductFaqs } from "@/lib/faq";
import {
  formatMoney,
  formatRating,
  formatReviewCount,
  formatUpdatedAt,
  isPriceStale,
} from "@/lib/format";
import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildPageMetadata,
  buildProductJsonLd,
  productImageAlt,
  productMetaDescription,
  productMetaTitle,
} from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { canOptimizeImage } from "@/lib/images";
import { splitIntoParagraphs } from "@/lib/text";
import { formatMessage, getI18n, getLocale, localizeCategoryName } from "@/lib/i18n";
import styles from "./product.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  try {
    const product = await getProduct(slug);
    return buildPageMetadata({
      title: productMetaTitle(product, locale),
      description: productMetaDescription(product, locale),
      path: `/p/${slug}`,
      image: product.imageUrl,
      locale,
      keywords: [
        product.title,
        product.brand,
        product.categoryName
          ? localizeCategoryName(product.categoryName, locale)
          : null,
        locale === "ko" ? "아마존 딜" : "Amazon deal",
        locale === "ko" ? "할인" : "price drop",
        SITE_NAME,
      ].filter(Boolean) as string[],
    });
  } catch {
    return buildPageMetadata({
      title: locale === "ko" ? "아마존 상품 딜" : "Amazon Product Deal",
      description:
        locale === "ko"
          ? `${SITE_NAME}에서 Amazon.com 상품 딜과 가격을 확인하세요.`
          : `Browse curated Amazon.com product deals and prices on ${SITE_NAME}.`,
      path: `/p/${slug}`,
      locale,
    });
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  let product;
  try {
    product = await getProduct(slug);
  } catch (error) {
    // Only a real 404 is a missing product; outages must surface as errors,
    // not soft-404s that get the URL deindexed.
    if (isApiNotFound(error)) {
      notFound();
    }
    throw error;
  }

  let related: Awaited<ReturnType<typeof getRelatedProducts>> = [];
  try {
    related = await getRelatedProducts(slug);
  } catch {
    related = [];
  }

  // Optional extra: the page still renders if the history can't be loaded.
  let priceHistory: PriceHistory | null = null;
  try {
    priceHistory = await getPriceHistory(slug);
  } catch {
    priceHistory = null;
  }

  let guides: GuideSummary[] = [];
  if (product.categorySlug) {
    try {
      guides = (await getGuides({ category: product.categorySlug, size: 3 })).items;
    } catch {
      guides = [];
    }
  }

  const { locale, t } = await getI18n();
  const price = formatMoney(product.priceAmount, product.currency, locale);
  const listPrice = formatMoney(product.listPrice, product.currency, locale);
  const rating = formatRating(product.rating);
  const reviews = formatReviewCount(product.reviewCount, locale);
  const goHref = `/go/${product.slug}`;
  const imageAlt = productImageAlt(product);
  const localizedCategory = product.categoryName
    ? localizeCategoryName(product.categoryName, locale)
    : null;

  const breadcrumbItems = [
    { name: t.breadcrumbHome, path: "/" },
    ...(product.categorySlug && localizedCategory
      ? [{ name: localizedCategory, path: `/c/${product.categorySlug}` }]
      : []),
    { name: product.title, path: `/p/${product.slug}` },
  ];
  const faqs = getProductFaqs(product);
  const faqJsonLd = buildFaqJsonLd(faqs);
  const recommendationParagraphs = splitIntoParagraphs(product.recommendation);
  const categoryLabel = localizedCategory?.trim();
  const priceCheckedAt =
    product.priceCheckedAt || product.lastSyncedAt || product.updatedAt || product.publishedAt;
  const updatedLabel = formatUpdatedAt(priceCheckedAt, locale);
  const priceStale = isPriceStale(priceCheckedAt);
  const intro =
    locale === "ko"
      ? [
          `${product.title}은(는) ${SITE_NAME}의 Amazon.com 큐레이션 딜`,
          categoryLabel ? ` · ${categoryLabel}` : "",
          price ? `입니다. 현재 표시 가격은 ${price}` : "입니다",
          listPrice && listPrice !== price
            ? `. 비교 가격은 ${listPrice}`
            : "",
          rating
            ? `. 쇼핑객 평점은 ${rating}${t.stars}${
                reviews ? ` · 약 ${reviews}${t.reviews}` : ""
              }`
            : "",
          ".",
        ].join("")
      : [
          `${product.title} is a curated Amazon.com deal on ${SITE_NAME}`,
          categoryLabel ? ` in ${categoryLabel}` : "",
          price ? `. The currently shown price is ${price}` : "",
          listPrice && listPrice !== price
            ? `. The listed comparison price is ${listPrice}`
            : "",
          rating
            ? `. Shopper rating signals show ${rating} ${t.stars}${
                reviews ? ` from about ${reviews} ${t.reviews}` : ""
              }`
            : "",
          ".",
        ].join("");

  return (
    <main className={styles.main}>
      <JsonLd
        data={[
          buildProductJsonLd(product),
          buildBreadcrumbJsonLd(breadcrumbItems),
          ...(faqJsonLd ? [faqJsonLd] : []),
        ]}
      />
      <div className={styles.inner}>
        <nav className={styles.crumbs} aria-label={t.breadcrumb}>
          <Link href="/">{t.breadcrumbHome}</Link>
          {product.categorySlug && localizedCategory ? (
            <>
              <span aria-hidden>/</span>
              <Link href={`/c/${product.categorySlug}`}>
                {localizedCategory}
              </Link>
            </>
          ) : null}
          <span aria-hidden>/</span>
          <span>{product.title}</span>
        </nav>

        <div className={styles.layout}>
          <div className={styles.media}>
            <div className={styles.imageWrap}>
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={imageAlt}
                  width={720}
                  height={720}
                  className={styles.image}
                  priority
                  unoptimized={!canOptimizeImage(product.imageUrl)}
                />
              ) : (
                <div className={styles.placeholder} />
              )}
            </div>

            <div className={styles.ctaBlock}>
              <a
                href={goHref}
                className={styles.cta}
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
              >
                {t.viewOnAmazon}
              </a>
              <AffiliateDisclosure />
              <p className={styles.siteNote}>
                {formatMessage(t.curatedBy, { site: SITE_NAME })}
              </p>
            </div>
          </div>

          <div className={styles.info}>
            {product.brand ? (
              <p className={styles.brand}>{product.brand}</p>
            ) : null}
            <h1 className={styles.title}>{product.title}</h1>
            <div className={styles.meta}>
              {price ? <span className={styles.price}>{price}</span> : null}
              {listPrice && listPrice !== price ? (
                <span className={styles.listPrice}>{listPrice}</span>
              ) : null}
              {rating ? (
                <span className={styles.rating}>
                  {rating} {t.stars}
                  {reviews ? ` · ${reviews} ${t.reviews}` : ""}
                </span>
              ) : null}
            </div>
            {updatedLabel ? (
              <p className={styles.updated}>
                {t.priceAsOf} {updatedLabel}
                {priceStale ? ` · ${t.priceMayHaveChanged}` : ""}
              </p>
            ) : null}
            {priceHistory ? (
              <PriceHistoryPanel history={priceHistory} locale={locale} t={t} />
            ) : null}
            <p className={styles.intro}>{intro}</p>
            {recommendationParagraphs.length > 0 ? (
              <section
                className={styles.recommendation}
                aria-labelledby="why-recommend"
              >
                <h2 id="why-recommend" className={styles.recommendationTitle}>
                  {t.whyRecommend}
                </h2>
                <p className={styles.recommendationByline}>
                  {formatMessage(t.curationByline, { site: SITE_NAME })}
                </p>
                <div className={styles.recommendationBody}>
                  {recommendationParagraphs.map((paragraph, index) => (
                    <p key={`${index}-${paragraph.slice(0, 24)}`}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ) : null}
            {product.features?.length ? (
              <ul className={styles.features}>
                {product.features.map((feature, index) => (
                  <li key={`${index}-${feature}`}>{feature}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        {guides.length > 0 && localizedCategory ? (
          <section className={styles.guides} aria-labelledby="guides-heading">
            <h2 id="guides-heading" className={styles.relatedTitle}>
              {formatMessage(t.guidesForCategory, { name: localizedCategory })}
            </h2>
            <div className={styles.guideGrid}>
              {guides.map((guide) => (
                <GuideCard key={guide.id} guide={guide} showCategory={false} />
              ))}
            </div>
          </section>
        ) : null}

        <FaqSection items={faqs} />

        {related.length > 0 ? (
          <section className={styles.related} aria-labelledby="related-heading">
            <h2 id="related-heading" className={styles.relatedTitle}>
              {t.relatedDeals}
            </h2>
            <DealList products={related} showNewBadge={false} />
          </section>
        ) : null}
      </div>
    </main>
  );
}
