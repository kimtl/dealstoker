import Link from "next/link";
import { ProductMiniList } from "@/components/ProductMiniCard";
import { formatUpdatedAt } from "@/lib/format";
import { guideHref, localizeGuide } from "@/lib/guides";
import { formatMessage, getI18n, localizeCategoryName } from "@/lib/i18n";
import { SITE_NAME } from "@/lib/site";
import type { MagazineStory } from "@/lib/types";
import styles from "./GuideLead.module.css";

type Props = {
  story: MagazineStory;
};

/** Homepage lead story: large guide card with the products it recommends. */
export async function GuideLead({ story }: Props) {
  const { guide, products } = story;
  const { locale, t } = await getI18n();
  const localized = localizeGuide(guide, locale);
  const href = guideHref(guide.slug, locale);
  const date = formatUpdatedAt(guide.publishedAt || guide.updatedAt, locale);
  const category = guide.categoryName
    ? localizeCategoryName(guide.categoryName, locale)
    : null;
  const kicker = guide.featured ? t.editorsPick : category || t.guidesTitle;

  return (
    <article className={styles.lead}>
      <Link href={href} className={styles.media} aria-hidden tabIndex={-1}>
        {guide.coverImageUrl ? (
          // Cover hosts vary per author; plain <img> avoids next/image host errors.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={guide.coverImageUrl} alt="" decoding="async" />
        ) : (
          <span className={styles.fallback}>
            <span className={styles.fallbackKicker}>{SITE_NAME}</span>
            <span className={styles.fallbackMark}>{category || t.guidesTitle}</span>
          </span>
        )}
      </Link>
      <div className={styles.body}>
        <p className={styles.kicker}>
          {kicker}
          {guide.featured && category ? <span> · {category}</span> : null}
        </p>
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
        </p>
        <Link href={href} className={styles.cta}>
          {t.readGuide} →
        </Link>
      </div>
      {products.length > 0 ? (
        <div className={styles.picks}>
          <ProductMiniList products={products} label={t.guidePicks} columns={2} />
        </div>
      ) : null}
    </article>
  );
}
