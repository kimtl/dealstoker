"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminAnalyticsSummary } from "@/lib/admin-api";
import type { AnalyticsSummary } from "@/lib/types";
import styles from "../admin.module.css";

const RANGES = [7, 30, 90] as const;

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(7);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminAnalyticsSummary(days)
      .then((summary) => {
        if (!cancelled) {
          setData(summary);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  return (
    <div>
      <h1 className={styles.title}>Analytics</h1>
      <p className={styles.muted} style={{ marginBottom: "1rem" }}>
        Site visits, product page views, and Amazon outbound clicks.
      </p>

      <div className={styles.actions} style={{ marginBottom: "1rem" }}>
        {RANGES.map((range) => (
          <button
            key={range}
            type="button"
            className={
              days === range ? styles.button : styles.buttonSecondary
            }
            onClick={() => setDays(range)}
          >
            Last {range} days
          </button>
        ))}
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {loading && !data ? <p className={styles.muted}>Loading…</p> : null}

      {data ? (
        <>
          <div className={styles.gridStats}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{data.uniqueVisitors}</div>
              <div className={styles.statLabel}>Unique visitors</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{data.uniqueSessions}</div>
              <div className={styles.statLabel}>Sessions</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{data.pageViews}</div>
              <div className={styles.statLabel}>Page views</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{data.productViews}</div>
              <div className={styles.statLabel}>Product views</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{data.outboundClicks}</div>
              <div className={styles.statLabel}>Amazon clicks</div>
            </div>
          </div>

          <h2 className={styles.sectionTitle}>Daily breakdown</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date (UTC)</th>
                  <th>Visitors</th>
                  <th>Sessions</th>
                  <th>Page views</th>
                  <th>Product views</th>
                  <th>Clicks</th>
                </tr>
              </thead>
              <tbody>
                {data.daily.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.muted}>
                      No traffic recorded in this range yet.
                    </td>
                  </tr>
                ) : (
                  [...data.daily].reverse().map((row) => (
                    <tr key={row.date}>
                      <td>{row.date}</td>
                      <td>{row.visitors}</td>
                      <td>{row.sessions}</td>
                      <td>{row.pageViews}</td>
                      <td>{row.productViews}</td>
                      <td>{row.outboundClicks}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <h2 className={styles.sectionTitle}>Top products</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Views</th>
                  <th>Clicks</th>
                  <th>CTR</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={styles.muted}>
                      No product activity in this range yet.
                    </td>
                  </tr>
                ) : (
                  data.topProducts.map((product) => {
                    const ctr =
                      product.views > 0
                        ? `${((product.clicks / product.views) * 100).toFixed(1)}%`
                        : product.clicks > 0
                          ? "—"
                          : "0%";
                    return (
                      <tr key={product.productId}>
                        <td>
                          <div>{product.title}</div>
                          <div className={styles.muted}>{product.slug}</div>
                        </td>
                        <td>{product.views}</td>
                        <td>{product.clicks}</td>
                        <td>{ctr}</td>
                        <td>
                          <div className={styles.actions}>
                            <Link
                              className={styles.buttonSecondary}
                              href={`/p/${product.slug}`}
                              target="_blank"
                            >
                              View
                            </Link>
                            <Link
                              className={styles.buttonSecondary}
                              href={`/admin/products/${product.productId}`}
                            >
                              Edit
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
