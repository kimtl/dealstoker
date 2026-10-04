"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { adminGetGuide } from "@/lib/admin-api";
import type { GuideDetail } from "@/lib/types";
import { GuideForm } from "../GuideForm";
import styles from "../../admin.module.css";

export default function EditGuidePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [guide, setGuide] = useState<GuideDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setError("Invalid guide id");
      return;
    }
    adminGetGuide(id)
      .then(setGuide)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load guide"),
      );
  }, [id]);

  return (
    <div>
      <p className={styles.muted}>
        <Link href="/admin/guides">← Guides</Link>
      </p>
      <h1 className={styles.title}>
        {guide ? `Edit guide #${guide.id}` : "Edit guide"}
      </h1>
      {error ? <p className={styles.error}>{error}</p> : null}
      {guide ? (
        <div className={styles.card}>
          <GuideForm key={guide.id} guide={guide} />
        </div>
      ) : !error ? (
        <p className={styles.muted}>Loading…</p>
      ) : null}
    </div>
  );
}
