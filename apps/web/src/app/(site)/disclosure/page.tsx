import { getI18n } from "@/lib/i18n";
import { buildMetadata } from "@/lib/metadata";
import { SITE_NAME } from "@/lib/site";
import styles from "../policy.module.css";

export const metadata = buildMetadata({
  title: "Affiliate Disclosure",
  description:
    "DealStoker affiliate disclosure for Amazon Associates (United States).",
  path: "/disclosure",
});

export default async function DisclosurePage() {
  const { t } = await getI18n();

  return (
    <main className={styles.main}>
      <article className={styles.inner}>
        <h1 className={styles.title}>{t.disclosureTitle}</h1>
        <p className={styles.updated}>{t.disclosureLead}</p>
        <p>
          <strong>{t.affiliateShort}</strong>
        </p>
        <p>{t.disclosureBody}</p>
        <p>
          {SITE_NAME} · <a href="/about">{t.about}</a> ·{" "}
          <a href="/contact">{t.contact}</a>
        </p>
      </article>
    </main>
  );
}
