import type { Metadata } from "next";
import { NewsletterTokenAction } from "@/components/NewsletterTokenAction";
import { getI18n } from "@/lib/i18n";
import styles from "../../policy.module.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function NewsletterConfirmPage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  const { locale, t } = await getI18n();
  return (
    <main className={styles.main}>
      <article className={styles.inner}>
        <NewsletterTokenAction
          action="confirm"
          token={token?.trim() || null}
          homeHref={locale === "ko" ? "/?hl=ko" : "/"}
          classNames={{ title: styles.title, button: styles.actionButton }}
          labels={{
            title: t.newsletterConfirmTitle,
            body: t.newsletterConfirmBody,
            working: t.newsletterConfirming,
            done: t.newsletterConfirmBody,
            invalid: t.newsletterInvalidLink,
            home: t.notFoundHome,
          }}
        />
      </article>
    </main>
  );
}
