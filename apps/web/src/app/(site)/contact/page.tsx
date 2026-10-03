import type { Metadata } from "next";
import { formatMessage, getI18n, getLocale } from "@/lib/i18n";
import {
  buildPageMetadata,
  contactMetaDescription,
  contactMetaTitle,
} from "@/lib/seo";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import styles from "../policy.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return buildPageMetadata({
    title: contactMetaTitle(locale),
    description: contactMetaDescription(locale),
    path: "/contact",
    locale,
  });
}

export default async function ContactPage() {
  const { t } = await getI18n();
  const helloEmail = `hello@${SITE_DOMAIN}`;
  const privacyEmail = `privacy@${SITE_DOMAIN}`;
  const body = formatMessage(t.contactBody, { domain: SITE_DOMAIN });

  return (
    <main className={styles.main}>
      <article className={styles.inner}>
        <h1 className={styles.title}>{t.contactTitle}</h1>
        <p className={styles.updated}>{t.contactLead}</p>
        <p>
          {body.split(new RegExp(`(${helloEmail}|${privacyEmail})`)).map((part, index) =>
            part === helloEmail || part === privacyEmail ? (
              <a key={`${part}-${index}`} href={`mailto:${part}`}>
                {part}
              </a>
            ) : (
              <span key={`${index}-${part.slice(0, 12)}`}>{part}</span>
            ),
          )}
        </p>
        <h2>{t.privacy}</h2>
        <p>
          <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>
        </p>
        <p>
          {SITE_NAME}
          <br />
          {t.unitedStates}
        </p>
      </article>
    </main>
  );
}
