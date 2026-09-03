"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  adminDeleteProduct,
  adminFeatureProduct,
  adminListProducts,
  adminPublishProduct,
  adminUnpublishProduct,
} from "@/lib/admin-api";
import type { ProductStatus, ProductSummary } from "@/lib/types";
import styles from "../admin.module.css";

export default function AdminProductsPage() {
  const [items, setItems] = useState<ProductSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<ProductStatus | "">("");
  const [error, setError] = useState<string | null>(null);

  async function load(nextStatus: ProductStatus | "" = status) {
    const data = await adminListProducts({
      status: nextStatus || undefined,
      page: 0,
      size: 100,
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

  async function togglePublish(product: ProductSummary) {
    try {
      if (product.status === "PUBLISHED") {
        await adminUnpublishProduct(product.id);
      } else {
        await adminPublishProduct(product.id);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish action failed");
    }
  }

  async function toggleFeature(product: ProductSummary) {
    try {
      await adminFeatureProduct(product.id, {
        featured: !product.featured,
        featuredRank: product.featured ? 0 : product.featuredRank || 100,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Feature action failed");
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this product?")) return;
    try {
      await adminDeleteProduct(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div>
      <h1 className={styles.title}>Products</h1>
      <div className={styles.actions} style={{ marginBottom: "1rem" }}>
        <Link className={styles.button} href="/admin/products/new">
          New product
        </Link>
        <select
          value={status}
          onChange={(e) => {
            const value = e.target.value as ProductStatus | "";
            setStatus(value);
            load(value).catch((err) =>
              setError(err instanceof Error ? err.message : "Failed to load"),
            );
          }}
        >
          <option value="">All statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="PUBLISHED">PUBLISHED</option>
          <option value="UNPUBLISHED">UNPUBLISHED</option>
          <option value="OUTDATED">OUTDATED</option>
          <option value="BLOCKED">BLOCKED</option>
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
              <th>Featured</th>
              <th>Views</th>
              <th>Clicks</th>
              <th>Price</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>
                  <div>{product.title}</div>
                  <div className={styles.muted}>{product.slug}</div>
                </td>
                <td>{product.categoryName || "—"}</td>
                <td>{product.status}</td>
                <td>
                  {product.featured
                    ? `Yes (#${product.featuredRank ?? "—"})`
                    : "No"}
                </td>
                <td>{product.viewCount ?? 0}</td>
                <td>{product.buyClickCount ?? 0}</td>
                <td>
                  {product.priceAmount != null
                    ? `${product.currency || "USD"} ${product.priceAmount}`
                    : "—"}
                </td>
                <td>
                  <div className={styles.actions}>
                    <Link
                      className={styles.buttonSecondary}
                      href={`/admin/products/${product.id}`}
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className={styles.buttonSecondary}
                      onClick={() => toggleFeature(product)}
                    >
                      {product.featured ? "Unfeature" : "Feature"}
                    </button>
                    <button
                      type="button"
                      className={styles.button}
                      onClick={() => togglePublish(product)}
                    >
                      {product.status === "PUBLISHED"
                        ? "Unpublish"
                        : "Publish"}
                    </button>
                    <button
                      type="button"
                      className={styles.buttonDanger}
                      onClick={() => onDelete(product.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
