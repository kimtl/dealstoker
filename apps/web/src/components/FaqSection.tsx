import type { FaqItem } from "@/lib/faq";
import { getMessages } from "@/lib/i18n";
import styles from "./FaqSection.module.css";

type FaqSectionProps = {
  title?: string;
  items: FaqItem[];
  id?: string;
};

export async function FaqSection({
  title,
  items,
  id = "faq",
}: FaqSectionProps) {
  if (!items.length) return null;
  const t = await getMessages();
  const heading = title || t.faqTitle;

  return (
    <section className={styles.section} aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className={styles.title}>
        {heading}
      </h2>
      <div className={styles.list}>
        {items.map((item) => (
          <details key={item.question} className={styles.item}>
            <summary className={styles.question}>{item.question}</summary>
            <p className={styles.answer}>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
