import { buildMetadata } from "@/lib/metadata";
import { SITE_NAME } from "@/lib/site";
import styles from "../policy.module.css";

export const metadata = buildMetadata({
  title: `About ${SITE_NAME}`,
  description:
    "Learn how DealStoker curates practical Amazon.com products for US shoppers.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <main className={styles.main}>
      <article className={styles.inner}>
        <h1 className={styles.title}>About {SITE_NAME}</h1>
        <p className={styles.updated}>Built for Amazon.com shoppers in the United States.</p>
        <p>
          {SITE_NAME} is a category-based deal curation site. We highlight
          practical products — home essentials, everyday electronics, and outdoor
          gear — so you can compare options faster and click through with
          context.
        </p>
        <h2>How we choose products</h2>
        <p>
          Editors review ratings, review volume, usefulness, and price
          positioning before a product is published. We favor clear use-cases
          over hype. Listings can be updated or unpublished when availability or
          quality signals change.
        </p>
        <h2>How we make money</h2>
        <p>
          When you buy through our links, we may earn a commission at no extra
          cost to you. That affiliate relationship helps fund research and site
          maintenance. See our{" "}
          <a href="/disclosure">affiliate disclosure</a> for details.
        </p>
        <h2>Contact</h2>
        <p>
          Questions about a listing or the site? Visit our{" "}
          <a href="/contact">contact page</a>.
        </p>
      </article>
    </main>
  );
}
