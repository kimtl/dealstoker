import Link from "next/link";
import { Suspense } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { getI18n } from "@/lib/i18n";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import styles from "./Footer.module.css";

export async function Footer() {
  const year = new Date().getFullYear();
  const { locale, t } = await getI18n();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandBlock}>
          <p className={styles.brand}>{SITE_NAME}</p>
          <p className={styles.tagline}>{t.footerTagline}</p>
          <Suspense fallback={null}>
            <LanguageSwitcher locale={locale} t={t} />
          </Suspense>
        </div>
        <NewsletterSignup source="footer" variant="footer" />
        <nav className={styles.links} aria-label={t.footerNav}>
          <Link href={locale === "ko" ? "/guides?hl=ko" : "/guides"}>
            {t.guides}
          </Link>
          <Link href={locale === "ko" ? "/about?hl=ko" : "/about"}>
            {t.about}
          </Link>
          <Link href={locale === "ko" ? "/disclosure?hl=ko" : "/disclosure"}>
            {t.disclosure}
          </Link>
          <Link href={locale === "ko" ? "/privacy?hl=ko" : "/privacy"}>
            {t.privacy}
          </Link>
          <Link href={locale === "ko" ? "/contact?hl=ko" : "/contact"}>
            {t.contact}
          </Link>
        </nav>
        <p className={styles.disclosure}>
          {t.affiliateShort} {t.affiliateNoCost}{" "}
          <Link href={locale === "ko" ? "/disclosure?hl=ko" : "/disclosure"}>
            {t.fullDisclosure}
          </Link>
        </p>
        <p className={styles.copy}>
          © {year} {SITE_NAME} · {SITE_DOMAIN}
        </p>
      </div>
    </footer>
  );
}
