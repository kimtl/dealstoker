"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  adminDeleteProduct,
  adminFeatureProduct,
  adminGenerateMissingRecommendations,
  adminListProducts,
  adminPriceRefreshStatus,
  adminPublishProduct,
  adminStartPriceRefresh,
  adminUnpublishProduct,
} from "@/lib/admin-api";
import { formatUpdatedAt, isPriceStale } from "@/lib/format";
import type { PriceRefreshStatus, ProductStatus, ProductSummary } from "@/lib/types";
import styles from "../admin.module.css";

export default function AdminProductsPage() {
  const [items, setItems] = useState<ProductSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<ProductStatus | "">("");
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [prices, setPrices] = useState<PriceRefreshStatus | null>(null);

  async function loadPrices() {
    setPrices(await adminPriceRefreshStatus());
  }

  async function onRefreshPrices() {
    if (
      !confirm(
        "Refresh Amazon prices for all published products now? It runs in the background " +
          "with a pause between products, so it can take a while.",
      )
    ) {
      return;
    }
    setError(null);
    try {
      setPrices(await adminStartPriceRefresh());
      setNote("Price refresh started. This panel updates every few seconds.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the price refresh");
      await loadPrices().catch(() => undefined);
    }
  }

  // Poll while a refresh is running, then reload the table once it finishes.
  useEffect(() => {
    if (!prices?.running) return;
    const timer = setInterval(() => {
      adminPriceRefreshStatus()
        .then((next) => {
          setPrices(next);
          if (!next.running) load().catch(() => undefined);
        })
        .catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prices?.running]);

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
    loadPrices().catch(() => undefined);
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

  async function onGenerateMissing() {
    setGenerating(true);
    setError(null);
    setNote(null);
    try {
      const result = await adminGenerateMissingRecommendations(20);
      setNote(
        `AI recommendations: ${result.updated} updated, ${result.failed} failed (${result.attempted} attempted).`,
      );
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Batch recommendation generation failed",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <h1 className={styles.title}>Products</h1>
      <div className={styles.actions} style={{ marginBottom: "1rem" }}>
        <Link className={styles.button} href="/admin/products/new">
          New product
        </Link>
        <Link
          className={styles.buttonSecondary}
          href="/admin/products/keyword-import"
        >
          Keyword import
        </Link>
        <button
          type="button"
          className={styles.buttonSecondary}
          onClick={onGenerateMissing}
          disabled={generating}
        >
          {generating
            ? "Generating…"
            : "AI fill missing recommendations"}
        </button>
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
      {note ? <p className={styles.okNote}>{note}</p> : null}

      {prices ? (
        <div className={styles.importBox} style={{ marginBottom: "1rem" }}>
          <div className={styles.actions} style={{ justifyContent: "space-between" }}>
            <div>
              <strong>Amazon prices</strong>{" "}
              <span className={styles.muted}>
                {prices.freshWithin24h} of {prices.total} published checked in the last 24h
                {prices.stale > 0 ? ` · ${prices.stale} stale` : ""}
              </span>
              <div className={styles.muted}>
                {prices.enabled
                  ? `Daily refresh: ${prices.schedule}`
                  : "Daily refresh is turned off (PRICE_REFRESH_ENABLED=false)."}
                {prices.lastRun
                  ? ` · Last run (${prices.lastRun.trigger}) ${formatUpdatedAt(prices.lastRun.finishedAt)}: ` +
                    `${prices.lastRun.updated} updated, ${prices.lastRun.noPrice} without price, ` +
                    `${prices.lastRun.failed} failed${prices.lastRun.aborted ? " (stopped early)" : ""}`
                  : " · No run since the API last started."}
              </div>
              {prices.lastRun?.aborted ? (
                <div className={styles.error}>{prices.lastRun.message}</div>
              ) : null}
            </div>
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={onRefreshPrices}
              disabled={prices.running}
            >
              {prices.running ? "Refreshing prices…" : "Refresh all prices now"}
            </button>
          </div>
        </div>
      ) : null}

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
              <th title="When the price was last confirmed (US Eastern)">Price checked</th>
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
                <td
                  className={isPriceStale(product.priceCheckedAt) ? styles.error : undefined}
                  title={isPriceStale(product.priceCheckedAt) ? "Older than 36 hours" : undefined}
                >
                  {formatUpdatedAt(product.priceCheckedAt) ?? "—"}
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
