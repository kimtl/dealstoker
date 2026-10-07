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
        ? [SITE_NAME, "아마존 구매 가이드", "아마존 딜", "미국 쇼핑", "Amazon.com"]
        : [
            SITE_NAME,
            "Amazon buying guides",
            "Amazon deals",
            "Amazon Associate",
            "deal curation",
            "US shoppers",
            "Amazon.com",
          ],
  });
}

export default async function AboutPage() {
  const { locale, t } = await getI18n();
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
        <p>{formatMessage(t.aboutIntro, vars)}</p>

        <h2>{t.aboutWhyTitle}</h2>
        <p>{t.aboutWhy}</p>

        <h2>{t.aboutFindTitle}</h2>
        <ul>
          <li>
            <a href={locale === "ko" ? "/guides?hl=ko" : "/guides"}>
              {t.guidesTitle}
            </a>
            : {t.aboutGuidesItem}
          </li>
          <li>{t.aboutFeaturedItem}</li>
          <li>{t.aboutTopViewsItem}</li>
          <li>{t.aboutCategoryItem}</li>
          <li>{t.aboutProductItem}</li>
        </ul>

        <h2>{t.aboutHowTitle}</h2>
        <p>{t.aboutHowPick}</p>
        <p>{t.aboutHowAi}</p>
        <p>{formatMessage(t.aboutHowPrices, vars)}</p>

        <h2>{t.aboutAffiliateTitle}</h2>
        <p>
          {formatMessage(t.aboutAffiliate, vars)}{" "}
          <a href="/disclosure">{t.disclosure}</a>
        </p>

        <h2>{t.aboutFeedbackTitle}</h2>
        <p>
          {t.aboutFeedback} <a href="/contact">{t.contact}</a>
        </p>

        <FaqSection items={faqs} />
      </article>
    </main>
  );
}
