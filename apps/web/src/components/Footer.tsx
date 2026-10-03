import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
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
          <LanguageSwitcher locale={locale} t={t} />
        </div>
        <nav className={styles.links} aria-label={t.footerNav}>
          <Link href="/about">{t.about}</Link>
          <Link href="/disclosure">{t.disclosure}</Link>
          <Link href="/privacy">{t.privacy}</Link>
          <Link href="/contact">{t.contact}</Link>
        </nav>
        <p className={styles.disclosure}>{t.affiliateShort}</p>
        <p className={styles.copy}>
          © {year} {SITE_NAME} · {SITE_DOMAIN}
        </p>
      </div>
    </footer>
  );
}
