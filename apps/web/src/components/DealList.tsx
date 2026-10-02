import type { ProductSummary } from "@/lib/types";
import { getMessages } from "@/lib/i18n";
import { DealListItem } from "./DealListItem";
import styles from "./DealList.module.css";

type Props = {
  products: ProductSummary[];
  emptyMessage?: string;
  showNewBadge?: boolean;
  showViewRank?: boolean;
};

export async function DealList({
  products,
  emptyMessage,
  showNewBadge = true,
  showViewRank = false,
}: Props) {
  const t = await getMessages();
  if (products.length === 0) {
    return <p className={styles.empty}>{emptyMessage || t.noDealsYet}</p>;
  }

  return (
    <div className={styles.board} role="list">
      {products.map((product, index) => (
        <div key={product.id} role="listitem">
          <DealListItem
            product={product}
            index={index}
            showNewBadge={showNewBadge}
            viewRank={showViewRank ? index + 1 : undefined}
            showViewCount={showViewRank}
          />
        </div>
      ))}
    </div>
  );
}
