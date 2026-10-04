import type { Metadata } from "next";
import { formatMessage, getI18n, getLocale } from "@/lib/i18n";
import {
  buildPageMetadata,
  privacyMetaDescription,
  privacyMetaTitle,
} from "@/lib/seo";
import { SITE_DOMAIN } from "@/lib/site";
import styles from "../policy.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return buildPageMetadata({
    title: privacyMetaTitle(locale),
    description: privacyMetaDescription(locale),
    path: "/privacy",
    locale,
  });
}

export default async function PrivacyPage() {
  const { t } = await getI18n();

  return (
    <main className={styles.main}>
      <article className={styles.inner}>
        <h1 className={styles.title}>{t.privacyTitle}</h1>
        <p className={styles.updated}>{t.privacyLead}</p>
        <p>{formatMessage(t.privacyBody, { domain: SITE_DOMAIN })}</p>
        <p>
          <a href={`mailto:privacy@${SITE_DOMAIN}`}>privacy@{SITE_DOMAIN}</a> ·{" "}
          <a href="/contact">{t.contact}</a>
        </p>
      </article>
    </main>
  );
}
