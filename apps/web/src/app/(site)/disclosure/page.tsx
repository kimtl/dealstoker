import { buildMetadata } from "@/lib/metadata";
import {
  AFFILIATE_DISCLOSURE_LONG,
  AFFILIATE_DISCLOSURE_SHORT,
  SITE_DOMAIN,
  SITE_NAME,
} from "@/lib/site";
import styles from "../policy.module.css";

export const metadata = buildMetadata({
  title: "Affiliate Disclosure",
  description:
    "DealStoker affiliate disclosure for Amazon Associates (United States).",
  path: "/disclosure",
});

export default function DisclosurePage() {
  return (
    <main className={styles.main}>
      <article className={styles.inner}>
        <h1 className={styles.title}>Affiliate Disclosure</h1>
        <p className={styles.updated}>Last updated: September 2, 2026</p>
        <p>
          <strong>{AFFILIATE_DISCLOSURE_SHORT}</strong>
        </p>
        <p>{AFFILIATE_DISCLOSURE_LONG}</p>
        <h2>What this means for you</h2>
        <ul>
          <li>
            Product links on {SITE_NAME} may be affiliate links to Amazon.com.
          </li>
          <li>
            If you purchase after clicking, we may earn a commission at no
            additional cost to you.
          </li>
          <li>
            Commission relationships do not change the price you pay on Amazon.
          </li>
          <li>
            We aim to recommend products we believe are useful; compensation is
            not the sole factor in curation.
          </li>
        </ul>
        <h2>Where disclosure appears</h2>
        <p>
          Short disclosure language appears in the site footer and near “View on
          Amazon” calls-to-action. This page is the full disclosure for{" "}
          {SITE_NAME} on {SITE_DOMAIN}.
        </p>
        <h2>FTC compliance</h2>
        <p>
          In accordance with FTC guidelines, we disclose material connections
          with sellers and affiliate networks. Disclosure language also appears
          near outbound calls-to-action and in the site footer.
        </p>
        <h2>Amazon trademarks</h2>
        <p>
          Amazon, Amazon.com, and related marks are trademarks of Amazon.com,
          Inc. or its affiliates. {SITE_NAME} is not endorsed, sponsored, or
          otherwise affiliated with Amazon beyond participation in the Amazon
          Associates Program (when approved and active).
        </p>
      </article>
    </main>
  );
}
