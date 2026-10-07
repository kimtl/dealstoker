"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  adminListGuides,
  adminPublishGuide,
  adminUnpublishGuide,
} from "@/lib/admin-api";
import type { GuideStatus, GuideSummary } from "@/lib/types";
import styles from "../admin.module.css";

export default function AdminGuidesPage() {
  const [items, setItems] = useState<GuideSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<GuideStatus | "">("");
  const [error, setError] = useState<string | null>(null);

  async function load(nextStatus: GuideStatus | "" = status) {
    const data = await adminListGuides({
      status: nextStatus || undefined,
      page: 0,
      size: 50,
    });
    setItems(data.items);
    setTotal(data.totalElements);
  }

  useEffect(() => {
    load().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggle(guide: GuideSummary) {
    setError(null);
    try {
      if (guide.status === "PUBLISHED") {
        await adminUnpublishGuide(guide.id);
      } else {
        await adminPublishGuide(guide.id);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  return (
    <div>
      <h1 className={styles.title}>Guides</h1>
      <p className={styles.muted}>
        Editorial buying guides published at /guides/&lt;slug&gt;. Published guides
        also appear on their category page and in the sitemap.
      </p>

      <div className={styles.actions} style={{ marginBottom: "1rem" }}>
        <Link className={styles.button} href="/admin/guides/new">
          New guide
        </Link>
        <select
          value={status}
          onChange={(e) => {
            const value = e.target.value as GuideStatus | "";
            setStatus(value);
            load(value).catch((err) =>
              setError(err instanceof Error ? err.message : "Failed to load"),
            );
          }}
        >
          <option value="">All statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="PUBLISHED">PUBLISHED</option>
        </select>
        <span className={styles.muted}>{total} total</span>
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>KO</th>
              <th>Published</th>
              <th title="Human page views (bots excluded), English and Korean combined">
                Views
              </th>
              <th title="Human page views in the last 7 days">7d</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.muted}>
                  No guides yet.
                </td>
              </tr>
            ) : (
              items.map((guide) => (
                <tr key={guide.id}>
                  <td>{guide.id}</td>
                  <td>
                    <Link href={`/admin/guides/${guide.id}`}>{guide.title}</Link>
                    <div className={styles.muted}>/guides/{guide.slug}</div>
                  </td>
                  <td>{guide.categoryName || "—"}</td>
                  <td>{guide.status}</td>
                  <td>{guide.titleKo ? "✓" : "—"}</td>
                  <td>
                    {guide.publishedAt
                      ? new Date(guide.publishedAt).toLocaleDateString("en-US")
                      : "—"}
                  </td>
                  <td>{(guide.viewCount ?? 0).toLocaleString("en-US")}</td>
                  <td>{(guide.viewCount7d ?? 0).toLocaleString("en-US")}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.buttonSecondary}
                        onClick={() => toggle(guide)}
                      >
                        {guide.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                      </button>
                      {guide.status === "PUBLISHED" ? (
                        <a
                          className={styles.buttonSecondary}
                          href={`/guides/${guide.slug}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </a>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
