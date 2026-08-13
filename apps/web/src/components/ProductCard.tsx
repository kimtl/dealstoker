import Image from "next/image";
import Link from "next/link";
import { formatMoney, formatRating, formatReviewCount } from "@/lib/format";
import type { ProductSummary } from "@/lib/types";
import styles from "./ProductCard.module.css";

type Props = {
  product: ProductSummary;
  index?: number;
};

export function ProductCard({ product, index = 0 }: Props) {
  const price = formatMoney(product.priceAmount, product.currency);
  const rating = formatRating(product.rating);
  const reviews = formatReviewCount(product.reviewCount);
  const delay = Math.min(index, 8) * 45;

  return (
    <article
      className={styles.card}
      style={{ animationDelay: `${delay}ms` }}
    >
      <Link href={`/p/${product.slug}`} className={styles.link}>
        <div className={styles.media}>
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              width={420}
              height={420}
              className={styles.image}
            />
          ) : (
            <div className={styles.placeholder} aria-hidden />
          )}
        </div>
        <div className={styles.body}>
          {product.brand ? (
            <p className={styles.brand}>{product.brand}</p>
          ) : null}
          <h3 className={styles.title}>{product.title}</h3>
          <div className={styles.meta}>
            {price ? <span className={styles.price}>{price}</span> : null}
            {rating ? (
              <span className={styles.rating}>
                {rating}
                {reviews ? ` · ${reviews} reviews` : ""}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
