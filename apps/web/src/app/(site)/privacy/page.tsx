import type { Metadata } from "next";
import { MarkdownBody } from "@/components/MarkdownBody";
import { formatMessage, getI18n, getLocale } from "@/lib/i18n";
import { PRIVACY_LAST_UPDATED, privacyPolicyMarkdown } from "@/lib/privacy-policy";
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
  const { locale, t } = await getI18n();
  const date = new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${PRIVACY_LAST_UPDATED}T00:00:00Z`));

  return (
    <main className={styles.main}>
      <article className={styles.inner}>
        <h1 className={styles.title}>{t.privacyTitle}</h1>
        <p className={styles.updated}>{formatMessage(t.privacyLead, { date })}</p>
        <MarkdownBody
          markdown={formatMessage(privacyPolicyMarkdown(locale), {
            domain: SITE_DOMAIN,
          })}
        />
      </article>
    </main>
  );
}
