import { buildMetadata } from "@/lib/metadata";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
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
        <p className={styles.updated}>
          Built for Amazon.com shoppers in the United States.
        </p>
        <p>
          {SITE_NAME} ({SITE_DOMAIN}) is a category-based deal curation site. We
          highlight practical products — home essentials, everyday electronics,
          and outdoor gear — so you can compare options faster and click through
          to Amazon.com with context.
        </p>
        <h2>What you will find</h2>
        <ul>
          <li>
            <strong>Featured deals</strong> — editor-selected products we think
            are worth a look right now.
          </li>
          <li>
            <strong>Top buys</strong> — deals shoppers click through most often.
          </li>
          <li>
            <strong>Category pages</strong> — Home &amp; Kitchen, Electronics,
            and Outdoor &amp; Sports lists with prices and rating signals.
          </li>
          <li>
            <strong>Product pages</strong> — a short summary, key features when
            available, and a clear path to view the item on Amazon.
          </li>
        </ul>
        <h2>How we choose products</h2>
        <p>
          Editors review ratings, review volume, usefulness, and price
          positioning before a product is published. We favor clear use-cases
          over hype. Listings can be updated or unpublished when availability or
          quality signals change. Prices shown on {SITE_NAME} may differ from
          the live price on Amazon.com at the moment you buy.
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
