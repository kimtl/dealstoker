import Image from "next/image";
import Link from "next/link";
import { formatMoney, formatRating, formatUpdatedAt } from "@/lib/format";
import { canOptimizeImage } from "@/lib/images";
import { getI18n } from "@/lib/i18n";
import { productImageAlt } from "@/lib/seo";
import type { ProductSummary } from "@/lib/types";
import styles from "./ProductMiniCard.module.css";

type Props = {
  product: ProductSummary;
};

/** Compact product row for magazine sections (guide picks, category picks). */
export async function ProductMiniCard({ product }: Props) {
  const { locale, t } = await getI18n();
  const price = formatMoney(product.priceAmount, product.currency, locale);
  const listPrice = formatMoney(product.listPrice, product.currency, locale);
  const rating = formatRating(product.rating);
  const updated = formatUpdatedAt(product.updatedAt, locale);
  const showList =
    listPrice &&
    price &&
    listPrice !== price &&
    Number(product.listPrice) > Number(product.priceAmount);

  return (
    <Link
      href={`/p/${product.slug}`}
      className={styles.card}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className={styles.thumb}>
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={productImageAlt(product)}
            width={64}
            height={64}
            className={styles.image}
            unoptimized={!canOptimizeImage(product.imageUrl)}
          />
        ) : null}
      </span>
      <span className={styles.main}>
        <span className={styles.title}>{product.title}</span>
        <span className={styles.priceRow}>
          {price ? <span className={styles.price}>{price}</span> : null}
          {showList ? <span className={styles.listPrice}>{listPrice}</span> : null}
          {rating ? <span className={styles.rating}>{rating}★</span> : null}
        </span>
        {updated ? (
          <span className={styles.updated}>
            {t.updated} {updated}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

/** A small list of {@link ProductMiniCard}s; renders nothing when empty. */
export function ProductMiniList({
  products,
  label,
  columns = 1,
}: {
  products: ProductSummary[];
  label?: string;
  columns?: 1 | 2;
}) {
  if (products.length === 0) return null;
  return (
    <div className={styles.listWrap}>
      {label ? <p className={styles.label}>{label}</p> : null}
      <ul className={columns === 2 ? styles.listTwo : styles.list}>
        {products.map((product) => (
          <li key={product.id}>
            <ProductMiniCard product={product} />
          </li>
        ))}
      </ul>
    </div>
  );
}
