"use client";

import { useEffect, useId, useState } from "react";
import { splitIntoParagraphs } from "@/lib/text";
import styles from "./BuyingGuideModal.module.css";

type Props = {
  categoryName: string;
  buyingGuide: string;
};

export function BuyingGuideModalButton({ categoryName, buyingGuide }: Props) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const guide = buyingGuide.trim();
  const paragraphs = splitIntoParagraphs(guide);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!guide) return null;

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(true)}
      >
        Buying guide
      </button>
      {open ? (
        <div
          className={styles.backdrop}
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.dialogHeader}>
              <h2 id={titleId} className={styles.dialogTitle}>
                {categoryName} buying guide
              </h2>
              <button
                type="button"
                className={styles.close}
                onClick={() => setOpen(false)}
                aria-label="Close buying guide"
              >
                ×
              </button>
            </div>
            <div className={styles.dialogBody}>
              {paragraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
