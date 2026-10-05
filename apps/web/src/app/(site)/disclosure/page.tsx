import type { Metadata } from "next";
import { getI18n, getLocale } from "@/lib/i18n";
import {
  buildPageMetadata,
  disclosureMetaDescription,
  disclosureMetaTitle,
} from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import styles from "../policy.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return buildPageMetadata({
    title: disclosureMetaTitle(locale),
    description: disclosureMetaDescription(locale),
    path: "/disclosure",
    locale,
  });
}

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
        <h2>{t.disclosureNoCostTitle}</h2>
        <p>{t.disclosureNoCostBody}</p>
        <p>{t.disclosureIndependenceBody}</p>
        <p>
          {SITE_NAME} · <a href="/about">{t.about}</a> ·{" "}
          <a href="/contact">{t.contact}</a>
        </p>
      </article>
    </main>
  );
}
