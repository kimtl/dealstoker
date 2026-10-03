import { formatMessage, getI18n } from "@/lib/i18n";
import { buildMetadata } from "@/lib/metadata";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import styles from "../policy.module.css";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description: `Privacy practices for ${SITE_NAME} (${SITE_DOMAIN}).`,
  path: "/privacy",
});

export default async function PrivacyPage() {
  const { t } = await getI18n();

  return (
    <main className={styles.main}>
      <article className={styles.inner}>
        <h1 className={styles.title}>{t.privacyTitle}</h1>
        <p className={styles.updated}>{t.privacyLead}</p>
        <p>{formatMessage(t.privacyBody, { domain: SITE_DOMAIN })}</p>
        <p>
          <a href="mailto:privacy@dealstoker.com">privacy@dealstoker.com</a> ·{" "}
          <a href="/contact">{t.contact}</a>
        </p>
      </article>
    </main>
  );
}
