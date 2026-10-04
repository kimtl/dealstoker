"use client";

import Link from "next/link";
import { GuideForm } from "../GuideForm";
import styles from "../../admin.module.css";

export default function NewGuidePage() {
  return (
    <div>
      <p className={styles.muted}>
        <Link href="/admin/guides">← Guides</Link>
      </p>
      <h1 className={styles.title}>New guide</h1>
      <div className={styles.card}>
        <GuideForm guide={null} />
      </div>
    </div>
  );
}
