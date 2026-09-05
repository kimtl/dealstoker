import { buildMetadata } from "@/lib/metadata";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import styles from "../policy.module.css";

export const metadata = buildMetadata({
  title: `About ${SITE_NAME} — Amazon Deal Curation for US Shoppers`,
  description:
    "DealStoker is an Amazon deal curation site for US online shoppers. Since 2026 we cut the noise and highlight practical Amazon.com deals worth your attention.",
  path: "/about",
  keywords: [
    SITE_NAME,
    "Amazon deals",
    "Amazon Associate",
    "deal curation",
    "US shoppers",
    "Amazon.com",
  ],
});

export default function AboutPage() {
  return (
    <main className={styles.main}>
      <article className={styles.inner}>
        <h1 className={styles.title}>About {SITE_NAME}</h1>
        <p className={styles.updated}>
          Amazon deal curation for online shoppers in the United States.
        </p>

        <p>
          {SITE_NAME} ({SITE_DOMAIN}) is an Amazon deal curation site built for
          US online shoppers. Since 2026, we have helped shoppers find practical
          products faster — and thousands of people visit {SITE_NAME} every day
          looking for the best deals.
        </p>

        <h2>Our mission</h2>
        <p>
          Cut the noise. Show shoppers only the deals worth their time. Amazon
          is full of options; {SITE_NAME} focuses on clear prices, useful
          context, and products that make sense for everyday US buyers.
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
            <strong>Category pages</strong> — curated lists across Home &amp;
            Kitchen, Electronics, Outdoor &amp; Sports, Health &amp; Household,
            Pets, and more.
          </li>
          <li>
            <strong>Product pages</strong> — a short summary, key features when
            available, and a clear path to view the item on Amazon.com.
          </li>
        </ul>

        <h2>How we choose products</h2>
        <p>
          Editors review ratings, review volume, usefulness, and price
          positioning before a product is published. We favor clear use cases
          over hype. Listings can be updated or unpublished when availability or
          quality signals change. Prices shown on {SITE_NAME} may differ from
          the live price on Amazon.com at the moment you buy.
        </p>

        <h2>Amazon Associates</h2>
        <p>
          {SITE_NAME} is a participant in the Amazon Services LLC Associates
          Program. As an Amazon Associate, we may earn a commission when you buy
          through our links — at no extra cost to you. That support helps us keep
          researching, curating, and maintaining the site. See our{" "}
          <a href="/disclosure">affiliate disclosure</a> for full details.
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
