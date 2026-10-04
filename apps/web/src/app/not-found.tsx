import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getCategories } from "@/lib/api";
import { getI18n } from "@/lib/i18n";
import styles from "./(site)/policy.module.css";

/**
 * Root-level not-found so unmatched URLs (/foo, /admin/x) and notFound()
 * calls inside (site) both get the branded, localized page.
 */
export default async function NotFound() {
  const { locale, t } = await getI18n();
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  try {
    categories = await getCategories();
  } catch {
    categories = [];
  }
  const hl = locale === "ko" ? "?hl=ko" : "";

  return (
    <>
      <Header categories={categories} compact />
      <main className={styles.main}>
        <div className={styles.inner}>
          <h1 className={styles.title}>{t.notFoundTitle}</h1>
          <p>
            {t.notFoundBody} <Link href={`/${hl}`}>{t.notFoundHome}</Link> ·{" "}
            <Link href={`/search${hl}`}>{t.notFoundBrowse}</Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
