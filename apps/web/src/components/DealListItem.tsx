import Image from "next/image";
import Link from "next/link";
import { formatMoney, formatRating, formatReviewCount } from "@/lib/format";
import type { ProductSummary } from "@/lib/types";
import styles from "./DealListItem.module.css";

type Props = {
  product: ProductSummary;
  index?: number;
  showNewBadge?: boolean;
};

export function DealListItem({
  product,
  index = 0,
  showNewBadge = true,
}: Props) {
  const price = formatMoney(product.priceAmount, product.currency);
  const listPrice = formatMoney(product.listPrice, product.currency);
  const rating = formatRating(product.rating);
  const reviews = formatReviewCount(product.reviewCount);
  const delay = Math.min(index, 12) * 35;
  const showList =
    listPrice &&
    price &&
    listPrice !== price &&
    Number(product.listPrice) > Number(product.priceAmount);

  return (
    <article
      className={styles.row}
      style={{ animationDelay: `${delay}ms` }}
    >
      <Link href={`/p/${product.slug}`} className={styles.link}>
        <div className={styles.thumb}>
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt=""
              width={112}
              height={112}
              className={styles.image}
            />
          ) : (
            <div className={styles.placeholder} aria-hidden />
          )}
        </div>

        <div className={styles.main}>
          <div className={styles.titleRow}>
            {showNewBadge ? <span className={styles.badge}>New</span> : null}
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
          </div>

          {product.categoryName ? (
            <p className={styles.category}>{product.categoryName}</p>
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
