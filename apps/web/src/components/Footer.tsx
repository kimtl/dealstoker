import Link from "next/link";
import { SiteLogo } from "@/components/SiteLogo";
import {
  AFFILIATE_DISCLOSURE_SHORT,
  SITE_DOMAIN,
  SITE_NAME,
} from "@/lib/site";
import styles from "./Footer.module.css";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandBlock}>
          <Link href="/" className={styles.brandLink} aria-label={`${SITE_NAME} home`}>
            <SiteLogo height={52} />
          </Link>
          <p className={styles.tagline}>
            Curated Amazon.com picks for US shoppers — practical deals, clear
            context, no noise.
          </p>
        </div>
        <nav className={styles.links} aria-label="Footer">
          <Link href="/about">About</Link>
          <Link href="/disclosure">Affiliate Disclosure</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <p className={styles.disclosure}>{AFFILIATE_DISCLOSURE_SHORT}</p>
        <p className={styles.copy}>
          © {year} {SITE_NAME} · {SITE_DOMAIN}
        </p>
      </div>
    </footer>
  );
}
