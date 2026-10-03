import type { Metadata } from "next";
import { FaqSection } from "@/components/FaqSection";
import { JsonLd } from "@/components/JsonLd";
import { getAboutFaqs } from "@/lib/faq";
import { formatMessage, getI18n, getLocale } from "@/lib/i18n";
import {
  aboutMetaDescription,
  aboutMetaTitle,
  buildFaqJsonLd,
  buildPageMetadata,
} from "@/lib/seo";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import styles from "../policy.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return buildPageMetadata({
    title: aboutMetaTitle(locale),
    description: aboutMetaDescription(locale),
    path: "/about",
    locale,
    keywords:
      locale === "ko"
        ? [SITE_NAME, "아마존 딜", "딜 큐레이션", "미국 쇼핑", "Amazon.com"]
        : [
            SITE_NAME,
            "Amazon deals",
            "Amazon Associate",
            "deal curation",
            "US shoppers",
            "Amazon.com",
          ],
  });
}

export default async function AboutPage() {
  const { t } = await getI18n();
  const faqs = getAboutFaqs();
  const faqJsonLd = buildFaqJsonLd(faqs);
  const vars = { site: SITE_NAME, domain: SITE_DOMAIN };

  return (
    <main className={styles.main}>
      {faqJsonLd ? <JsonLd data={faqJsonLd} /> : null}
      <article className={styles.inner}>
        <h1 className={styles.title}>
          {formatMessage(t.aboutTitle, vars)}
        </h1>
        <p className={styles.updated}>{t.aboutLead}</p>
        <p>{formatMessage(t.aboutP1, vars)}</p>

        <h2>{t.aboutMissionTitle}</h2>
        <p>{formatMessage(t.aboutMission, vars)}</p>

        <h2>{t.aboutFindTitle}</h2>
        <ul>
          <li>{t.aboutFeaturedItem}</li>
          <li>{t.aboutTopViewsItem}</li>
          <li>{t.aboutCategoryItem}</li>
          <li>{t.aboutProductItem}</li>
        </ul>

        <h2>{t.aboutChooseTitle}</h2>
        <p>{formatMessage(t.aboutChoose, vars)}</p>

        <h2>{t.aboutAffiliateTitle}</h2>
        <p>
          {formatMessage(t.aboutAffiliate, vars)}{" "}
          <a href="/disclosure">{t.disclosure}</a>
        </p>

        <FaqSection items={faqs} />

        <h2>{t.contact}</h2>
        <p>
          <a href="/contact">{t.contact}</a>
        </p>
      </article>
    </main>
  );
}
