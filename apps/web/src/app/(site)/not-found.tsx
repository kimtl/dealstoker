import Link from "next/link";
import styles from "./policy.module.css";

export default function NotFound() {
  return (
    <main className={styles.main}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Page not found</h1>
        <p>
          That page is gone or the product is unpublished. Head back to the{" "}
          <Link href="/">homepage</Link> or browse{" "}
          <Link href="/c/home-kitchen">Home & Kitchen</Link>.
        </p>
      </div>
    </main>
  );
}
