"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  adminKeywordRegister,
  adminKeywordSearch,
  adminListCategories,
} from "@/lib/admin-api";
import type { Category, KeywordSearchHit } from "@/lib/types";
import styles from "../../admin.module.css";

type RowState = KeywordSearchHit & {
  selected: boolean;
  categoryId: string;
};

function asNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function money(value: number | string | null | undefined): string {
  const n = asNumber(value);
  return n == null ? "—" : `$${n.toFixed(2)}`;
}

export default function KeywordImportPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [keywords, setKeywords] = useState(
    "air fryer\nwireless earbuds\nrobot vacuum",
  );
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minDiscount, setMinDiscount] = useState("15");
  const [minRating, setMinRating] = useState("4.0");
  const [minReviews, setMinReviews] = useState("100");
  const [maxPerKeyword, setMaxPerKeyword] = useState("12");
  const [includeSponsored, setIncludeSponsored] = useState(false);
  const [includeExisting, setIncludeExisting] = useState(false);

  const [rows, setRows] = useState<RowState[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    adminListCategories()
      .then(setCategories)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load categories"),
      );
  }, []);

  const selectedCount = useMemo(
    () => rows.filter((row) => row.selected && !row.alreadyExists).length,
    [rows],
  );

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    setSearching(true);
    setError(null);
    setNote(null);
    setSummary(null);
    try {
      const keywordList = keywords
        .split(/\n|,/)
        .map((line) => line.trim())
        .filter(Boolean);
      if (keywordList.length === 0) {
        setError("Enter at least one keyword");
        return;
      }
      const result = await adminKeywordSearch({
        keywords: keywordList,
        minPrice: minPrice.trim() ? Number(minPrice) : null,
        maxPrice: maxPrice.trim() ? Number(maxPrice) : null,
        minDiscountPercent: minDiscount.trim() ? Number(minDiscount) : null,
        minRating: minRating.trim() ? Number(minRating) : null,
        minReviewCount: minReviews.trim() ? Number(minReviews) : null,
        maxPerKeyword: maxPerKeyword.trim()
          ? Number(maxPerKeyword)
          : 12,
        includeSponsored,
        includeExisting,
      });
      const fallbackCategoryId =
        categories.find((c) => c.active)?.id ?? categories[0]?.id;
      setRows(
        result.items.map((item) => ({
          ...item,
          selected: !item.alreadyExists,
          categoryId: String(
            item.suggestedCategoryId ?? fallbackCategoryId ?? "",
          ),
        })),
      );
      setNotes(result.notes || []);
      setSummary(
        `Keywords ${result.keywordCount} · raw hits ${result.rawHitCount} · matched ${result.matchedCount}`,
      );
      if (result.matchedCount === 0) {
        setNote(
          "No products matched the filters. Amazon may have blocked the crawl, or filters are too strict.",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Keyword search failed");
    } finally {
      setSearching(false);
    }
  }

  async function onRegister() {
    const items = rows
      .filter((row) => row.selected && !row.alreadyExists)
      .map((row) => ({
        asin: row.asin,
        primaryCategoryId: Number(row.categoryId),
      }))
      .filter((item) => item.primaryCategoryId > 0);

    if (items.length === 0) {
      setError("Select at least one product with a category");
      return;
    }
    if (items.some((item) => !item.primaryCategoryId)) {
      setError("Every selected product needs a category");
      return;
    }

    setRegistering(true);
    setError(null);
    setNote(null);
    try {
      const result = await adminKeywordRegister({ items });
      setNote(
        `Registered ${result.created} draft(s), ${result.failed} failed out of ${result.attempted}.`,
      );
      const failedAsins = new Set(
        result.results.filter((r) => !r.ok).map((r) => r.asin),
      );
      const createdAsins = new Set(
        result.results.filter((r) => r.ok).map((r) => r.asin),
      );
      setRows((prev) =>
        prev.map((row) => {
          if (createdAsins.has(row.asin)) {
            return { ...row, selected: false, alreadyExists: true };
          }
          if (failedAsins.has(row.asin)) {
            return row;
          }
          return row;
        }),
      );
      const firstError = result.results.find((r) => !r.ok)?.error;
      if (firstError) {
        setError(firstError);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Register failed");
    } finally {
      setRegistering(false);
    }
  }

  function setAllSelected(selected: boolean) {
    setRows((prev) =>
      prev.map((row) =>
        row.alreadyExists ? row : { ...row, selected },
      ),
    );
  }

  return (
    <div>
      <h1 className={styles.title}>Keyword import</h1>
      <p className={styles.muted}>
        Search Amazon.com by keyword (HTML crawl, no PA-API). Filter by price,
        discount, rating, and reviews, then register selected items as drafts
        with a product-fitting category.
      </p>

      <form className={styles.card} onSubmit={onSearch}>
        <div className={styles.form} style={{ maxWidth: "100%" }}>
          <label>
            Keywords (one per line, max 8)
            <textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              rows={5}
              required
            />
          </label>
          <div className={styles.row}>
            <label>
              Min price (USD)
              <input
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="e.g. 15"
              />
            </label>
            <label>
              Max price (USD)
              <input
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="e.g. 120"
              />
            </label>
          </div>
          <div className={styles.row}>
            <label>
              Min discount %
              <input
                value={minDiscount}
                onChange={(e) => setMinDiscount(e.target.value)}
                placeholder="e.g. 15"
              />
            </label>
            <label>
              Min rating
              <input
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                placeholder="e.g. 4.0"
              />
            </label>
          </div>
          <div className={styles.row}>
            <label>
              Min review count
              <input
                value={minReviews}
                onChange={(e) => setMinReviews(e.target.value)}
                placeholder="e.g. 100"
              />
            </label>
            <label>
              Max results / keyword
              <input
                value={maxPerKeyword}
                onChange={(e) => setMaxPerKeyword(e.target.value)}
              />
            </label>
          </div>
          <label
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              fontWeight: 650,
            }}
          >
            <input
              type="checkbox"
              checked={includeSponsored}
              onChange={(e) => setIncludeSponsored(e.target.checked)}
            />
            Include sponsored results
          </label>
          <label
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              fontWeight: 650,
            }}
          >
            <input
              type="checkbox"
              checked={includeExisting}
              onChange={(e) => setIncludeExisting(e.target.checked)}
            />
            Include ASINs already in catalog
          </label>
          <div className={styles.actions}>
            <button className={styles.button} type="submit" disabled={searching}>
              {searching ? "Searching Amazon…" : "Search Amazon"}
            </button>
            <Link className={styles.buttonSecondary} href="/admin/products">
              Back to products
            </Link>
          </div>
        </div>
      </form>

      {error ? <p className={styles.error}>{error}</p> : null}
      {note ? <p className={styles.okNote}>{note}</p> : null}
      {summary ? <p className={styles.muted}>{summary}</p> : null}
      {notes.length > 0 ? (
        <ul className={styles.muted} style={{ marginBottom: "1rem" }}>
          {notes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}

      {rows.length > 0 ? (
        <>
          <div className={styles.actions} style={{ marginBottom: "0.75rem" }}>
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={() => setAllSelected(true)}
            >
              Select all new
            </button>
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={() => setAllSelected(false)}
            >
              Clear selection
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={onRegister}
              disabled={registering || selectedCount === 0}
            >
              {registering
                ? "Registering…"
                : `Register selected (${selectedCount})`}
            </button>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th />
                  <th>Product</th>
                  <th>Price</th>
                  <th>Discount</th>
                  <th>Rating</th>
                  <th>Keyword</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.asin}>
                    <td>
                      <input
                        type="checkbox"
                        checked={row.selected}
                        disabled={row.alreadyExists}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((item) =>
                              item.asin === row.asin
                                ? { ...item, selected: e.target.checked }
                                : item,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.75rem",
                          alignItems: "flex-start",
                        }}
                      >
                        {row.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.imageUrl}
                            alt=""
                            width={56}
                            height={56}
                            style={{
                              objectFit: "contain",
                              background: "#f7faf8",
                              border: "1px solid rgba(16,40,34,0.08)",
                            }}
                          />
                        ) : null}
                        <div>
                          <div>{row.title}</div>
                          <div className={styles.muted}>
                            {row.asin}
                            {row.sponsored ? " · sponsored" : ""}
                            {row.alreadyExists
                              ? ` · already #${row.existingProductId}`
                              : ""}
                          </div>
                          <a
                            href={row.productUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.muted}
                          >
                            Amazon
                          </a>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{money(row.priceAmount)}</div>
                      {row.listPrice != null ? (
                        <div className={styles.muted}>
                          list {money(row.listPrice)}
                        </div>
                      ) : null}
                    </td>
                    <td>
                      {asNumber(row.discountPercent) != null
                        ? `${asNumber(row.discountPercent)}%`
                        : "—"}
                    </td>
                    <td>
                      {asNumber(row.rating) != null
                        ? `${asNumber(row.rating)} ★`
                        : "—"}
                      <div className={styles.muted}>
                        {row.reviewCount != null
                          ? `${row.reviewCount.toLocaleString()} reviews`
                          : "—"}
                      </div>
                    </td>
                    <td>{row.keyword}</td>
                    <td>
                      <select
                        value={row.categoryId}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((item) =>
                              item.asin === row.asin
                                ? { ...item, categoryId: e.target.value }
                                : item,
                            ),
                          )
                        }
                        disabled={row.alreadyExists}
                      >
                        <option value="" disabled>
                          Select…
                        </option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
