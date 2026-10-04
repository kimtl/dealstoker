import Link from "next/link";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { GuideCard } from "@/components/GuideCard";
import { JsonLd } from "@/components/JsonLd";
import { getGuides } from "@/lib/api";
import { formatMessage, getI18n, getLocale } from "@/lib/i18n";
import { buildBreadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import type { GuideSummary } from "@/lib/types";
import styles from "./guides.module.css";

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

const PAGE_SIZE = 12;

export async function generateMetadata() {
  const locale = await getLocale();
  const { t } = await getI18n();
  return buildPageMetadata({
    title: `${t.guidesTitle} | ${SITE_NAME}`,
    description: t.guidesLead,
    path: "/guides",
    locale,
    keywords:
      locale === "ko"
        ? ["아마존 구매 가이드", "구매 팁", SITE_NAME]
        : ["Amazon buying guide", "what to look for", "buying tips", SITE_NAME],
  });
}

export default async function GuidesPage({ searchParams }: PageProps) {
  const { locale, t } = await getI18n();
  const query = await searchParams;
  const page = Math.max(0, Number(query.page || "0") || 0);
  const hl = locale === "ko" ? "&hl=ko" : "";

  let guides: { items: GuideSummary[]; totalElements: number; totalPages: number } = {
    items: [],
    totalElements: 0,
    totalPages: 0,
  };
  try {
    guides = await getGuides({ page, size: PAGE_SIZE });
  } catch {
    // API offline: render the empty state rather than failing the page.
  }

  const jsonLd = buildBreadcrumbJsonLd([
    { name: t.breadcrumbHome, path: "/" },
    { name: t.guidesTitle, path: "/guides" },
  ]);

  return (
    <main className={styles.main}>
      <JsonLd data={jsonLd} />
      <div className={styles.inner}>
        <nav className={styles.crumbs} aria-label={t.breadcrumb}>
          <Link href={locale === "ko" ? "/?hl=ko" : "/"}>{t.frontpage}</Link>
          <span aria-hidden>/</span>
          <span>{t.guidesTitle}</span>
        </nav>

        <header className={styles.header}>
          <h1 className={styles.title}>{t.guidesTitle}</h1>
          <p className={styles.lead}>{t.guidesLead}</p>
          <AffiliateDisclosure />
        </header>

        {guides.items.length > 0 ? (
          <>
            <p className={styles.count}>
              {formatMessage(
                guides.totalElements === 1 ? t.guideCount : t.guidesCount,
                { count: guides.totalElements },
              )}
            </p>
            <div className={styles.grid}>
              {guides.items.map((guide) => (
                <GuideCard key={guide.id} guide={guide} />
              ))}
            </div>
          </>
        ) : (
          <p className={styles.empty}>{t.emptyGuides}</p>
        )}

        {guides.totalPages > 1 ? (
          <nav className={styles.pager} aria-label="Pagination">
            {page > 0 ? (
              <Link href={`/guides?page=${page - 1}${hl}`}>{t.previous}</Link>
            ) : (
              <span />
            )}
            <span>
              {formatMessage(t.pageOf, { page: page + 1, total: guides.totalPages })}
            </span>
            {page + 1 < guides.totalPages ? (
              <Link href={`/guides?page=${page + 1}${hl}`}>{t.next}</Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </div>
    </main>
  );
}
