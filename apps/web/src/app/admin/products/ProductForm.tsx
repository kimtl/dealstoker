"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminCreateProduct,
  adminImportAmazonProduct,
  adminListCategories,
  adminPreviewAmazonImport,
  adminUpdateProduct,
} from "@/lib/admin-api";
import type { Category, ProductDetail, ProductStatus } from "@/lib/types";
import styles from "../admin.module.css";

type FormState = {
  externalId: string;
  source: string;
  marketplace: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  priceAmount: string;
  currency: string;
  listPrice: string;
  availability: string;
  rating: string;
  reviewCount: string;
  detailPageUrl: string;
  brand: string;
  features: string;
  status: ProductStatus;
  seoTitle: string;
  seoDescription: string;
  primaryCategoryId: string;
  featured: boolean;
  featuredRank: string;
};

function toForm(product?: ProductDetail | null): FormState {
  return {
    externalId: product?.externalId || "",
    source: product?.source || "AMAZON",
    marketplace: product?.marketplace || "www.amazon.com",
    title: product?.title || "",
    slug: product?.slug || "",
    description: product?.description || "",
    imageUrl: product?.imageUrl || "",
    priceAmount:
      product?.priceAmount != null ? String(product.priceAmount) : "",
    currency: product?.currency || "USD",
    listPrice: product?.listPrice != null ? String(product.listPrice) : "",
    availability: product?.availability || "InStock",
    rating: product?.rating != null ? String(product.rating) : "",
    reviewCount:
      product?.reviewCount != null ? String(product.reviewCount) : "",
    detailPageUrl: product?.detailPageUrl || "",
    brand: product?.brand || "",
    features: (product?.features || []).join("\n"),
    status: product?.status || "DRAFT",
    seoTitle: product?.seoTitle || "",
    seoDescription: product?.seoDescription || "",
    primaryCategoryId:
      product?.primaryCategoryId != null
        ? String(product.primaryCategoryId)
        : "",
    featured: Boolean(product?.featured),
    featuredRank:
      product?.featuredRank != null ? String(product.featuredRank) : "100",
  };
}

function parseOptionalNumber(value: string): number | null | undefined {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

type Props = {
  product?: ProductDetail | null;
};

export function ProductForm({ product }: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>(() => toForm(product));
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [amazonUrl, setAmazonUrl] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    adminListCategories()
      .then((data) => {
        setCategories(data);
        if (!form.primaryCategoryId && data[0]) {
          setForm((prev) => ({
            ...prev,
            primaryCategoryId: String(data[0].id),
          }));
        }
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load categories"),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setForm(toForm(product));
  }, [product]);

  function applyPreviewToForm(preview: Awaited<ReturnType<typeof adminPreviewAmazonImport>>) {
    setForm((prev) => ({
      ...prev,
      externalId: preview.asin || prev.externalId,
      source: "AMAZON",
      marketplace: preview.marketplace || prev.marketplace || "www.amazon.com",
      title: preview.title || prev.title,
      description: preview.description || prev.description,
      imageUrl: preview.imageUrl || prev.imageUrl,
      priceAmount:
        preview.priceAmount != null ? String(preview.priceAmount) : prev.priceAmount,
      listPrice:
        preview.listPrice != null ? String(preview.listPrice) : prev.listPrice,
      currency: preview.currency || prev.currency || "USD",
      rating: preview.rating != null ? String(preview.rating) : prev.rating,
      reviewCount:
        preview.reviewCount != null ? String(preview.reviewCount) : prev.reviewCount,
      detailPageUrl: preview.canonicalUrl || prev.detailPageUrl,
      brand: preview.brand || prev.brand,
      features:
        preview.features?.length > 0
          ? preview.features.join("\n")
          : prev.features,
      status: prev.status || "DRAFT",
      seoTitle: preview.title
        ? preview.title.slice(0, 60)
        : prev.seoTitle,
      seoDescription: preview.description
        ? preview.description.slice(0, 155)
        : prev.seoDescription,
    }));
    setNote(
      [
        preview.note,
        "Outbound URL is set to the Amazon product page for now. Replace it with a SiteStripe affiliate link before or after publish.",
        preview.alreadyExists
          ? `Existing product id: ${preview.existingProductId}`
          : null,
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  async function onPreviewImport() {
    setImporting(true);
    setError(null);
    setNote(null);
    try {
      const preview = await adminPreviewAmazonImport(amazonUrl.trim());
      applyPreviewToForm(preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import preview failed");
    } finally {
      setImporting(false);
    }
  }

  async function onImportAndSaveDraft() {
    if (!form.primaryCategoryId) {
      setError("Select a primary category first");
      return;
    }
    setImporting(true);
    setError(null);
    setNote(null);
    try {
      const created = await adminImportAmazonProduct({
        amazonUrl: amazonUrl.trim(),
        primaryCategoryId: Number(form.primaryCategoryId),
        affiliateUrl: form.detailPageUrl.trim() || undefined,
        createAsDraft: true,
      });
      router.replace(`/admin/products/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const body = {
      externalId: form.externalId.trim(),
      source: form.source.trim() || undefined,
      marketplace: form.marketplace.trim() || undefined,
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      priceAmount: parseOptionalNumber(form.priceAmount),
      currency: form.currency.trim() || undefined,
      listPrice: parseOptionalNumber(form.listPrice),
      availability: form.availability.trim() || undefined,
      rating: parseOptionalNumber(form.rating),
      reviewCount: parseOptionalNumber(form.reviewCount) ?? null,
      detailPageUrl: form.detailPageUrl.trim(),
      brand: form.brand.trim() || undefined,
      features: form.features
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      status: form.status,
      seoTitle: form.seoTitle.trim() || undefined,
      seoDescription: form.seoDescription.trim() || undefined,
      primaryCategoryId: Number(form.primaryCategoryId),
      featured: form.featured,
      featuredRank: form.featured
        ? (parseOptionalNumber(form.featuredRank) ?? 100)
        : 0,
    };

    try {
      if (product) {
        await adminUpdateProduct(product.id, body);
      } else {
        const created = await adminCreateProduct(body);
        router.replace(`/admin/products/${created.id}`);
        return;
      }
      router.push("/admin/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      {error ? <p className={styles.error}>{error}</p> : null}
      {note ? <p className={styles.okNote}>{note}</p> : null}

      <div className={styles.importBox}>
        <h2>Import from Amazon URL</h2>
        <p className={styles.hint}>
          Paste an Amazon product URL (or ASIN). We extract the ASIN and try to
          fill title/image/price from the public page (no PA-API). Affiliate
          links from SiteStripe can be pasted into the outbound URL field
          afterward.
        </p>
        <label>
          Amazon URL or ASIN
          <input
            value={amazonUrl}
            onChange={(e) => setAmazonUrl(e.target.value)}
            placeholder="https://www.amazon.com/dp/B0XXXXXXXX"
          />
        </label>
        <div className={styles.importActions}>
          <button
            type="button"
            className={styles.buttonSecondary}
            onClick={onPreviewImport}
            disabled={importing || !amazonUrl.trim()}
          >
            {importing ? "Working…" : "Preview & fill form"}
          </button>
          {!product ? (
            <button
              type="button"
              className={styles.button}
              onClick={onImportAndSaveDraft}
              disabled={importing || !amazonUrl.trim()}
            >
              {importing ? "Working…" : "Import as draft"}
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.row}>
        <label>
          External ID (ASIN)
          <input
            value={form.externalId}
            onChange={(e) => setForm({ ...form, externalId: e.target.value })}
            required
          />
        </label>
        <label>
          Primary category
          <select
            value={form.primaryCategoryId}
            onChange={(e) =>
              setForm({ ...form, primaryCategoryId: e.target.value })
            }
            required
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
        </label>
      </div>
      <label>
        Title
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
      </label>
      <div className={styles.row}>
        <label>
          Slug
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
        </label>
        <label>
          Status
          <select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as ProductStatus })
            }
          >
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="UNPUBLISHED">UNPUBLISHED</option>
            <option value="OUTDATED">OUTDATED</option>
            <option value="BLOCKED">BLOCKED</option>
          </select>
        </label>
      </div>
      <div className={styles.row}>
        <label>
          <span>Featured deals</span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "0.45rem",
            }}
          >
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) =>
                setForm({ ...form, featured: e.target.checked })
              }
            />
            Show on homepage Featured deals
          </span>
        </label>
        <label>
          Featured rank (lower = higher)
          <input
            type="number"
            min={0}
            value={form.featuredRank}
            onChange={(e) =>
              setForm({ ...form, featuredRank: e.target.value })
            }
            disabled={!form.featured}
          />
        </label>
      </div>
      <label>
        Outbound Amazon / SiteStripe URL
        <input
          value={form.detailPageUrl}
          onChange={(e) =>
            setForm({ ...form, detailPageUrl: e.target.value })
          }
          required
        />
        <span className={styles.hint}>
          After import this is usually https://www.amazon.com/dp/ASIN. Replace
          with a SiteStripe affiliate link when you have one. Short links
          (amzn.to) are left as-is on redirect; full amazon.com links get
          tag=dealstoker01-20 appended when missing.
        </span>
      </label>
      <label>
        Image URL
        <input
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
        />
      </label>
      <label>
        Description
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </label>
      <label>
        Features (one per line)
        <textarea
          value={form.features}
          onChange={(e) => setForm({ ...form, features: e.target.value })}
        />
      </label>
      <div className={styles.row}>
        <label>
          Price
          <input
            value={form.priceAmount}
            onChange={(e) =>
              setForm({ ...form, priceAmount: e.target.value })
            }
          />
        </label>
        <label>
          List price
          <input
            value={form.listPrice}
            onChange={(e) => setForm({ ...form, listPrice: e.target.value })}
          />
        </label>
      </div>
      <div className={styles.row}>
        <label>
          Currency
          <input
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
          />
        </label>
        <label>
          Brand
          <input
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
          />
        </label>
      </div>
      <div className={styles.row}>
        <label>
          Rating
          <input
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: e.target.value })}
          />
        </label>
        <label>
          Review count
          <input
            value={form.reviewCount}
            onChange={(e) =>
              setForm({ ...form, reviewCount: e.target.value })
            }
          />
        </label>
      </div>
      <div className={styles.row}>
        <label>
          Source
          <input
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
          />
        </label>
        <label>
          Marketplace
          <input
            value={form.marketplace}
            onChange={(e) =>
              setForm({ ...form, marketplace: e.target.value })
            }
          />
        </label>
      </div>
      <label>
        Availability
        <input
          value={form.availability}
          onChange={(e) =>
            setForm({ ...form, availability: e.target.value })
          }
        />
      </label>
      <label>
        SEO title
        <input
          value={form.seoTitle}
          onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
        />
      </label>
      <label>
        SEO description
        <textarea
          value={form.seoDescription}
          onChange={(e) =>
            setForm({ ...form, seoDescription: e.target.value })
          }
        />
      </label>
      <div className={styles.actions}>
        <button className={styles.button} type="submit" disabled={saving}>
          {saving ? "Saving…" : product ? "Update product" : "Create product"}
        </button>
        <button
          className={styles.buttonSecondary}
          type="button"
          onClick={() => router.push("/admin/products")}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
