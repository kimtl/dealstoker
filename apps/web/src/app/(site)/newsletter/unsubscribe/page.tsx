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

export default async function NewsletterUnsubscribePage({ searchParams }: PageProps) {
  const { token } = await searchParams;
  const { locale, t } = await getI18n();
  return (
    <main className={styles.main}>
      <article className={styles.inner}>
        <NewsletterTokenAction
          action="unsubscribe"
          token={token?.trim() || null}
          homeHref={locale === "ko" ? "/?hl=ko" : "/"}
          classNames={{ title: styles.title, button: styles.actionButton }}
          labels={{
            title: t.newsletterUnsubTitle,
            body: t.newsletterUnsubBody,
            working: t.newsletterSending,
            done: t.newsletterUnsubDone,
            invalid: t.newsletterInvalidLink,
            button: t.newsletterUnsubButton,
            home: t.notFoundHome,
          }}
        />
      </article>
    </main>
  );
}
