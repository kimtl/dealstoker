import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import type { Category } from "@/lib/types";
import styles from "./Header.module.css";

type HeaderProps = {
  categories?: Category[];
  compact?: boolean;
};

export function Header({ categories = [], compact = false }: HeaderProps) {
  return (
    <header className={`${styles.header} ${compact ? styles.compact : ""}`}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label={`${SITE_NAME} home`}>
          <span className={styles.mark} aria-hidden />
          <span className={styles.brandText}>{SITE_NAME}</span>
        </Link>
        <nav className={styles.nav} aria-label="Primary">
          {categories.slice(0, 5).map((category) => (
            <Link
              key={category.id}
              href={`/c/${category.slug}`}
              className={styles.navLink}
            >
              {category.name}
            </Link>
          ))}
          <Link href="/about" className={styles.navLink}>
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
