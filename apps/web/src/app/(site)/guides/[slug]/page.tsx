import Link from "next/link";
import { notFound } from "next/navigation";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { GuideCard } from "@/components/GuideCard";
import { JsonLd } from "@/components/JsonLd";
import { MarkdownBody } from "@/components/MarkdownBody";
import { getGuide, getGuides, isApiNotFound } from "@/lib/api";
import { formatUpdatedAt } from "@/lib/format";
import { localizeGuide, readingMinutes } from "@/lib/guides";
import { formatMessage, getI18n, getLocale, localizeCategoryName } from "@/lib/i18n";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildPageMetadata,
  clampText,
} from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import type { GuideSummary } from "@/lib/types";
import styles from "./guide.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  try {
    const guide = await getGuide(slug);
    const localized = localizeGuide(guide, locale);
    const description =
      guide.seoDescription?.trim() ||
      localized.excerpt ||
      clampText(localized.body?.replace(/[#*_>`]/g, " ") || "", 160);
    return buildPageMetadata({
      title: guide.seoTitle?.trim() || `${localized.title} | ${SITE_NAME}`,
      description,
      path: `/guides/${slug}`,
      image: guide.coverImageUrl,
      locale,
      type: "article",
    });
  } catch {
    const { t } = await getI18n();
    return buildPageMetadata({
      title: `${t.guidesTitle} | ${SITE_NAME}`,
      description: t.guidesLead,
      path: `/guides/${slug}`,
      locale,
    });
  }
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const { locale, t } = await getI18n();

  let guide;
  try {
    guide = await getGuide(slug);
  } catch (error) {
    if (isApiNotFound(error)) {
      notFound();
    }
    throw error;
  }

  const localized = localizeGuide(guide, locale);
  const body = localized.body || "";
  const categoryName = guide.categoryName
    ? localizeCategoryName(guide.categoryName, locale)
    : null;
  const date = formatUpdatedAt(guide.publishedAt || guide.updatedAt, locale);
  const minutes = readingMinutes(body, locale);
  const hl = locale === "ko" ? "?hl=ko" : "";

  let related: GuideSummary[] = [];
  if (guide.categorySlug) {
    try {
      const page = await getGuides({ category: guide.categorySlug, size: 4 });
      related = page.items.filter((item) => item.id !== guide.id).slice(0, 3);
    } catch {
      related = [];
    }
  }

  const description =
    guide.seoDescription?.trim() || localized.excerpt || localized.title;
  const jsonLd = [
    buildArticleJsonLd({
      title: localized.title,
      description,
      path: `/guides/${guide.slug}`,
      image: guide.coverImageUrl,
      authorName: guide.authorName,
      publishedAt: guide.publishedAt,
      updatedAt: guide.updatedAt,
      locale,
    }),
    buildBreadcrumbJsonLd([
      { name: t.breadcrumbHome, path: "/" },
      { name: t.guidesTitle, path: "/guides" },
      { name: localized.title, path: `/guides/${guide.slug}` },
    ]),
  ];

  return (
    <main className={styles.main}>
      <JsonLd data={jsonLd} />
      <article className={styles.inner}>
        <nav className={styles.crumbs} aria-label={t.breadcrumb}>
          <Link href={`/${hl}`}>{t.frontpage}</Link>
          <span aria-hidden>/</span>
          <Link href={`/guides${hl}`}>{t.guidesTitle}</Link>
          {categoryName && guide.categorySlug ? (
            <>
              <span aria-hidden>/</span>
              <Link href={`/c/${guide.categorySlug}${hl}`}>{categoryName}</Link>
            </>
          ) : null}
        </nav>

        <header>
          {categoryName ? <p className={styles.kicker}>{categoryName}</p> : null}
          <h1 className={styles.title}>{localized.title}</h1>
          {localized.excerpt ? (
            <p className={styles.excerpt}>{localized.excerpt}</p>
          ) : null}
          <p className={styles.meta}>
            {guide.authorName ? (
              <span>{formatMessage(t.guideBy, { name: guide.authorName })}</span>
            ) : (
              <span>{formatMessage(t.guideBy, { name: SITE_NAME })}</span>
            )}
            {date ? (
              <span>
                {t.updated} {date}
              </span>
            ) : null}
            <span>{formatMessage(t.guideReadingTime, { minutes })}</span>
          </p>
        </header>

        <AffiliateDisclosure />

        {guide.coverImageUrl ? (
          <figure className={styles.cover}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={guide.coverImageUrl} alt="" decoding="async" />
          </figure>
        ) : null}

        {localized.isFallback ? (
          <p className={styles.notice}>{t.guideEnglishOnly}</p>
        ) : null}

        <MarkdownBody markdown={body} />

        <footer className={styles.footer}>
          <div className={styles.ctaRow}>
            {categoryName && guide.categorySlug ? (
              <Link href={`/c/${guide.categorySlug}${hl}`} className={styles.cta}>
                {formatMessage(t.guideBrowseDeals, { name: categoryName })}
              </Link>
            ) : null}
            <Link href={`/guides${hl}`} className={styles.ctaSecondary}>
              {t.allGuides}
            </Link>
          </div>
        </footer>

        {related.length > 0 && categoryName ? (
          <section className={styles.related} aria-labelledby="related-guides">
            <h2 id="related-guides" className={styles.relatedTitle}>
              {formatMessage(t.guidesForCategory, { name: categoryName })}
            </h2>
            <div className={styles.relatedGrid}>
              {related.map((item) => (
                <GuideCard key={item.id} guide={item} showCategory={false} />
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </main>
  );
}
