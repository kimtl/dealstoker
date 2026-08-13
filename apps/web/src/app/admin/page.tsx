"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminListCategories, adminListProducts } from "@/lib/admin-api";
import styles from "./admin.module.css";

export default function AdminDashboardPage() {
  const [categoryCount, setCategoryCount] = useState<number | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [publishedCount, setPublishedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [categories, products, published] = await Promise.all([
          adminListCategories(),
          adminListProducts({ page: 0, size: 1 }),
          adminListProducts({ status: "PUBLISHED", page: 0, size: 1 }),
        ]);
        if (cancelled) return;
        setCategoryCount(categories.length);
        setProductCount(products.totalElements);
        setPublishedCount(published.totalElements);
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
      </div>
      <div className={styles.actions}>
        <Link className={styles.button} href="/admin/categories">
          Manage categories
        </Link>
        <Link className={styles.buttonSecondary} href="/admin/products">
          Manage products
        </Link>
      </div>
    </div>
  );
}
