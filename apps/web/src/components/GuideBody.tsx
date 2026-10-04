import { DealListItem } from "@/components/DealListItem";
import { MarkdownBody } from "@/components/MarkdownBody";
import { getProduct } from "@/lib/api";
import { extractProductSlugs, splitGuideBody } from "@/lib/guides";
import type { ProductSummary } from "@/lib/types";
import styles from "./GuideBody.module.css";

type Props = {
  markdown: string;
};

/**
 * Renders a guide body: Markdown chunks interleaved with product cards wherever
 * the author placed a `{{product:slug}}` shortcode. Unknown or unpublished
 * products are skipped silently so a stale slug never breaks the article.
 */
export async function GuideBody({ markdown }: Props) {
  const segments = splitGuideBody(markdown);
  const slugs = extractProductSlugs(markdown);

  const products = new Map<string, ProductSummary>();
  await Promise.all(
    slugs.map(async (slug) => {
      try {
        const product = await getProduct(slug);
        if (product.status === "PUBLISHED") {
          products.set(slug, product);
        }
      } catch {
        // skip
      }
    }),
  );

  return (
    <div className={styles.body}>
      {segments.map((segment, index) => {
        if (segment.type === "markdown") {
          return <MarkdownBody key={`md-${index}`} markdown={segment.markdown} />;
        }
        const product = products.get(segment.slug);
        if (!product) return null;
        return (
          <aside
            key={`p-${index}-${segment.slug}`}
            className={styles.embed}
            aria-label={product.title}
          >
            <DealListItem product={product} index={0} showNewBadge={false} />
          </aside>
        );
      })}
    </div>
  );
}
