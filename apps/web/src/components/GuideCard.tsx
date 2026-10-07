import Link from "next/link";
import type { ReactNode } from "react";
import { formatUpdatedAt } from "@/lib/format";
import { guideHref, localizeGuide } from "@/lib/guides";
import { formatMessage, getI18n, localizeCategoryName } from "@/lib/i18n";
import type { GuideSummary } from "@/lib/types";
import styles from "./GuideCard.module.css";

type Props = {
  guide: GuideSummary;
  showCategory?: boolean;
  /** Extra content under the meta row, e.g. the products this guide recommends. */
  children?: ReactNode;
};

export async function GuideCard({ guide, showCategory = true, children }: Props) {
  const { locale, t } = await getI18n();
  const localized = localizeGuide(guide, locale);
  const href = guideHref(guide.slug, locale);
  const date = formatUpdatedAt(guide.publishedAt || guide.updatedAt, locale);
  const category =
    showCategory && guide.categoryName
      ? localizeCategoryName(guide.categoryName, locale)
      : null;

  return (
    <article className={styles.card}>
      {guide.coverImageUrl ? (
        <Link href={href} className={styles.media} aria-hidden tabIndex={-1}>
          {/* Cover hosts vary per author; plain <img> avoids next/image host errors. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={guide.coverImageUrl} alt="" loading="lazy" decoding="async" />
        </Link>
      ) : null}
      <div className={styles.body}>
        {category ? <p className={styles.kicker}>{category}</p> : null}
        <h3 className={styles.title}>
          <Link href={href}>{localized.title}</Link>
        </h3>
        {localized.excerpt ? (
          <p className={styles.excerpt}>{localized.excerpt}</p>
        ) : null}
        <p className={styles.meta}>
          {date ? <span>{date}</span> : null}
          {guide.authorName ? (
            <span>{formatMessage(t.guideBy, { name: guide.authorName })}</span>
          ) : null}
          <Link href={href} className={styles.more}>
            {t.readGuide} →
          </Link>
        </p>
        {children}
      </div>
    </article>
  );
}
