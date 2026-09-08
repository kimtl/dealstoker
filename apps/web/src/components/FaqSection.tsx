import type { FaqItem } from "@/lib/faq";
import styles from "./FaqSection.module.css";

type FaqSectionProps = {
  title?: string;
  items: FaqItem[];
  id?: string;
};

export function FaqSection({
  title = "Frequently asked questions",
  items,
  id = "faq",
}: FaqSectionProps) {
  if (!items.length) return null;

  return (
    <section className={styles.section} aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className={styles.title}>
        {title}
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
