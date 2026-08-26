import type { ProductSummary } from "@/lib/types";
import { DealListItem } from "./DealListItem";
import styles from "./DealList.module.css";

type Props = {
  products: ProductSummary[];
  emptyMessage?: string;
  showNewBadge?: boolean;
  showBuyRank?: boolean;
};

export function DealList({
  products,
  emptyMessage = "No deals yet.",
  showNewBadge = true,
  showBuyRank = false,
}: Props) {
  if (products.length === 0) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <div className={styles.board} role="list">
      {products.map((product, index) => (
        <div key={product.id} role="listitem">
          <DealListItem
            product={product}
            index={index}
            showNewBadge={showNewBadge}
            buyRank={showBuyRank ? index + 1 : undefined}
          />
        </div>
      ))}
    </div>
  );
}
