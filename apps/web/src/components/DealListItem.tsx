import Image from "next/image";
import Link from "next/link";
import {
  formatMoney,
  formatRating,
  formatReviewCount,
  formatUpdatedAt,
} from "@/lib/format";
import { canOptimizeImage } from "@/lib/images";
import { getI18n, localizeCategoryName } from "@/lib/i18n";
import { productImageAlt } from "@/lib/seo";
import type { ProductSummary } from "@/lib/types";
import styles from "./DealListItem.module.css";

type Props = {
  product: ProductSummary;
  index?: number;
  showNewBadge?: boolean;
  viewRank?: number;
  showViewCount?: boolean;
};

export async function DealListItem({
  product,
  index = 0,
  showNewBadge = true,
  viewRank,
  showViewCount = false,
}: Props) {
  const { locale, t } = await getI18n();
  const price = formatMoney(product.priceAmount, product.currency, locale);
  const listPrice = formatMoney(product.listPrice, product.currency, locale);
  const rating = formatRating(product.rating);
  const reviews = formatReviewCount(product.reviewCount, locale);
  const updated = formatUpdatedAt(product.updatedAt, locale);
  const delay = Math.min(index, 12) * 35;
  const alt = productImageAlt(product);
  const showList =
    listPrice &&
    price &&
    listPrice !== price &&
    Number(product.listPrice) > Number(product.priceAmount);
  const categoryName = product.categoryName
    ? localizeCategoryName(product.categoryName, locale)
    : null;

  return (
    <article
      className={styles.row}
      style={{ animationDelay: `${delay}ms` }}
    >
      <Link
        href={`/p/${product.slug}`}
        className={styles.link}
        target="_blank"
        rel="noopener noreferrer"
      >
        {viewRank ? (
          <span className={styles.rank} aria-label={`#${viewRank}`}>
            #{viewRank}
          </span>
        ) : null}

        <div className={styles.thumb}>
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={alt}
              width={112}
              height={112}
              className={styles.image}
              unoptimized={!canOptimizeImage(product.imageUrl)}
            />
          ) : (
            <div className={styles.placeholder} aria-hidden />
          )}
        </div>

        <div className={styles.main}>
          <div className={styles.titleRow}>
            {showNewBadge ? (
              <span className={styles.badge}>{t.newBadge}</span>
            ) : null}
            {product.featured ? (
              <span className={styles.badgeFeatured}>{t.featuredBadge}</span>
            ) : null}
            <h3 className={styles.title}>{product.title}</h3>
          </div>

          <div className={styles.priceRow}>
            {price ? <span className={styles.price}>{price}</span> : null}
            {showList ? (
              <span className={styles.listPrice}>{listPrice}</span>
            ) : null}
            {rating ? (
              <span className={styles.rating}>
                {rating}★{reviews ? ` · ${reviews}` : ""}
              </span>
            ) : null}
            {showViewCount && product.viewCount != null ? (
              <span className={styles.buys}>
                {product.viewCount.toLocaleString(
                  locale === "ko" ? "ko-KR" : "en-US",
                )}{" "}
                {product.viewCount === 1 ? t.view : t.views}
              </span>
            ) : null}
          </div>

          {categoryName ? (
            <p className={styles.category}>{categoryName}</p>
          ) : null}
          {updated ? (
            <p className={styles.updated}>
              {t.updated} {updated}
            </p>
          ) : null}
        </div>

        <div className={styles.storeCol}>
          <span className={styles.store}>Amazon</span>
          {product.brand ? (
            <span className={styles.brand}>{product.brand}</span>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
