"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  adminAnalyticsSummary,
  adminListCategories,
  adminListProducts,
} from "@/lib/admin-api";
import type { AnalyticsSummary } from "@/lib/types";
import styles from "./admin.module.css";

export default function AdminDashboardPage() {
  const [categoryCount, setCategoryCount] = useState<number | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [publishedCount, setPublishedCount] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [categories, products, published, summary] = await Promise.all([
          adminListCategories(),
          adminListProducts({ page: 0, size: 1 }),
          adminListProducts({ status: "PUBLISHED", page: 0, size: 1 }),
          adminAnalyticsSummary(7),
        ]);
        if (cancelled) return;
        setCategoryCount(categories.length);
        setProductCount(products.totalElements);
        setPublishedCount(published.totalElements);
        setAnalytics(summary);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className={styles.title}>Dashboard</h1>
      {error ? <p className={styles.error}>{error}</p> : null}
      <div className={styles.gridStats}>
        <div className={styles.stat}>
          <div className={styles.statValue}>
            {categoryCount === null ? "—" : categoryCount}
          </div>
          <div className={styles.statLabel}>Categories</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>
            {productCount === null ? "—" : productCount}
          </div>
          <div className={styles.statLabel}>Products</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>
            {publishedCount === null ? "—" : publishedCount}
          </div>
          <div className={styles.statLabel}>Published</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>
            {analytics ? analytics.uniqueVisitors : "—"}
          </div>
          <div className={styles.statLabel}>Visitors (7d)</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>
            {analytics ? analytics.productViews : "—"}
          </div>
          <div className={styles.statLabel}>Product views (7d)</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>
            {analytics ? analytics.outboundClicks : "—"}
          </div>
          <div className={styles.statLabel}>Amazon clicks (7d)</div>
        </div>
      </div>
      <div className={styles.actions}>
        <Link className={styles.button} href="/admin/analytics">
          View analytics
        </Link>
        <Link className={styles.buttonSecondary} href="/admin/categories">
          Manage categories
        </Link>
        <Link className={styles.buttonSecondary} href="/admin/products">
          Manage products
        </Link>
      </div>
    </div>
  );
}
