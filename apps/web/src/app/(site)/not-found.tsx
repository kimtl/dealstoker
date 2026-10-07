import Link from "next/link";
import { getI18n } from "@/lib/i18n";
import styles from "./policy.module.css";

/**
 * 404 for notFound() inside (site) pages (unknown product, guide or category).
 * The (site) layout already renders the header and footer; the root not-found draws its
 * own, so using it here showed them twice. Unmatched URLs still use app/not-found.tsx.
 */
export default async function SiteNotFound() {
  const { locale, t } = await getI18n();
  const hl = locale === "ko" ? "?hl=ko" : "";

  return (
    <main className={styles.main}>
      <div className={styles.inner}>
        <h1 className={styles.title}>{t.notFoundTitle}</h1>
        <p>
          {t.notFoundBody} <Link href={`/${hl}`}>{t.notFoundHome}</Link> ·{" "}
          <Link href={`/search${hl}`}>{t.notFoundBrowse}</Link>
        </p>
      </div>
    </main>
  );
}
