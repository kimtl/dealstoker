import { FaqSection } from "@/components/FaqSection";
import { JsonLd } from "@/components/JsonLd";
import { getAboutFaqs } from "@/lib/faq";
import { formatMessage, getI18n } from "@/lib/i18n";
import { buildMetadata } from "@/lib/metadata";
import { buildFaqJsonLd } from "@/lib/seo";
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
