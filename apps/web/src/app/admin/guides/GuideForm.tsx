"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  adminCreateGuide,
  adminDeleteGuide,
  adminDraftGuide,
  adminListCategories,
  adminListCategoryProducts,
  adminRewriteGuide,
  adminTranslateGuide,
  adminUpdateGuide,
} from "@/lib/admin-api";
import type {
  Category,
  GuideDetail,
  GuideRequest,
  GuideStatus,
  ProductSummary,
} from "@/lib/types";
import { wordCount } from "@/lib/guides";
import styles from "../admin.module.css";

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  titleKo: string;
  excerptKo: string;
  bodyKo: string;
  categoryId: string;
  coverImageUrl: string;
  authorName: string;
  status: GuideStatus;
  featured: boolean;
  featuredRank: string;
  seoTitle: string;
  seoDescription: string;
};

const EMPTY: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  titleKo: "",
  excerptKo: "",
  bodyKo: "",
  categoryId: "",
  coverImageUrl: "",
  authorName: "DealStoker curation team",
  status: "DRAFT",
  featured: false,
  featuredRank: "0",
  seoTitle: "",
  seoDescription: "",
};

function toForm(guide: GuideDetail | null): FormState {
  if (!guide) return EMPTY;
  return {
    title: guide.title,
    slug: guide.slug,
    excerpt: guide.excerpt || "",
    body: guide.body,
    titleKo: guide.titleKo || "",
    excerptKo: guide.excerptKo || "",
    bodyKo: guide.bodyKo || "",
    categoryId: guide.categoryId ? String(guide.categoryId) : "",
    coverImageUrl: guide.coverImageUrl || "",
    authorName: guide.authorName || "",
    status: guide.status,
    featured: Boolean(guide.featured),
    featuredRank: String(guide.featuredRank ?? 0),
    seoTitle: guide.seoTitle || "",
    seoDescription: guide.seoDescription || "",
  };
}

function toRequest(form: FormState): GuideRequest {
  const clean = (value: string) => value.trim() || null;
  return {
    title: form.title.trim(),
    slug: clean(form.slug),
    excerpt: clean(form.excerpt),
    body: form.body.trim(),
    titleKo: clean(form.titleKo),
    excerptKo: clean(form.excerptKo),
    bodyKo: clean(form.bodyKo),
    categoryId: form.categoryId ? Number(form.categoryId) : null,
    coverImageUrl: clean(form.coverImageUrl),
    authorName: clean(form.authorName),
    status: form.status,
    featured: form.featured,
    featuredRank: Math.min(999, Math.max(0, Math.trunc(Number(form.featuredRank) || 0))),
    seoTitle: clean(form.seoTitle),
    seoDescription: clean(form.seoDescription),
  };
}

export function GuideForm({ guide }: { guide: GuideDetail | null }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toForm(guide));
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // AI helpers (nothing is saved until the form is submitted).
  const [aiTopic, setAiTopic] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSlugs, setAiSlugs] = useState<string[]>([]);
  const [drafting, setDrafting] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [categoryProducts, setCategoryProducts] = useState<ProductSummary[]>([]);
  const [pickedSlug, setPickedSlug] = useState("");

  useEffect(() => {
    adminListCategories()
      .then(setCategories)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load categories"),
      );
  }, []);

  const selectedCategory = categories.find(
    (category) => String(category.id) === form.categoryId,
  );

  useEffect(() => {
    if (!selectedCategory) {
      setCategoryProducts([]);
      return;
    }
    let cancelled = false;
    adminListCategoryProducts(selectedCategory.slug)
      .then((page) => {
        if (!cancelled) setCategoryProducts(page.items);
      })
      .catch(() => {
        if (!cancelled) setCategoryProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function insertShortcode(slug: string) {
    if (!slug) return;
    const shortcode = `{{product:${slug}}}`;
    setForm((prev) => {
      if (prev.body.includes(shortcode)) return prev;
      const body = prev.body.trimEnd();
      return { ...prev, body: body ? `${body}\n\n${shortcode}\n` : `${shortcode}\n` };
    });
    setPickedSlug("");
  }

  function toggleAiSlug(slug: string) {
    setAiSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  async function onDraft() {
    if (!form.categoryId && !aiTopic.trim()) {
      setError("Pick a category or enter a topic before drafting.");
      return;
    }
    if (
      form.body.trim() &&
      !confirm("Replace the current English title, excerpt and body with the AI draft?")
    ) {
      return;
    }
    setDrafting(true);
    setError(null);
    setMessage(null);
    try {
      const draft = await adminDraftGuide({
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        topic: aiTopic.trim() || null,
        productSlugs: aiSlugs,
        prompt: aiPrompt.trim() || null,
      });
      setForm((prev) => ({
        ...prev,
        title: draft.title || prev.title,
        excerpt: draft.excerpt || prev.excerpt,
        body: draft.body,
      }));
      setMessage("Draft generated — review every claim before publishing.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI draft failed");
    } finally {
      setDrafting(false);
    }
  }

  async function onRewrite() {
    if (!form.body.trim()) {
      setError("There is no English body to rewrite yet.");
      return;
    }
    if (
      !confirm(
        "Rewrite the current English title, excerpt and body into a longer, more natural guide? " +
          "Product cards are kept. Unsaved edits will be replaced (nothing is saved until you click Save).",
      )
    ) {
      return;
    }
    setRewriting(true);
    setError(null);
    setMessage(null);
    try {
      const draft = await adminRewriteGuide({
        title: form.title || null,
        excerpt: form.excerpt || null,
        body: form.body,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        prompt: aiPrompt.trim() || null,
      });
      setForm((prev) => ({
        ...prev,
        title: draft.title || prev.title,
        excerpt: draft.excerpt || prev.excerpt,
        body: draft.body,
      }));
      setMessage(
        `Rewritten (${wordCount(draft.body).toLocaleString("en-US")} words). Review every claim, ` +
          "then save and re-run the Korean translation.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI rewrite failed");
    } finally {
      setRewriting(false);
    }
  }

  async function onTranslate() {
    if (!form.body.trim()) {
      setError("Write the English body first.");
      return;
    }
    if (
      form.bodyKo.trim() &&
      !confirm("Replace the current Korean title, excerpt and body with the AI translation?")
    ) {
      return;
    }
    setTranslating(true);
    setError(null);
    setMessage(null);
    try {
      const result = await adminTranslateGuide({
        title: form.title,
        excerpt: form.excerpt || null,
        body: form.body,
      });
      setForm((prev) => ({
        ...prev,
        titleKo: result.titleKo || prev.titleKo,
        excerptKo: result.excerptKo || prev.excerptKo,
        bodyKo: result.bodyKo,
      }));
      setMessage("Korean translation drafted — proofread before publishing.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI translation failed");
    } finally {
      setTranslating(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const body = toRequest(form);
      if (guide) {
        const saved = await adminUpdateGuide(guide.id, body);
        setForm(toForm(saved));
        setMessage(`Saved. Public URL: /guides/${saved.slug}`);
      } else {
        const created = await adminCreateGuide(body);
        router.replace(`/admin/guides/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!guide) return;
    if (!confirm("Delete this guide? This cannot be undone.")) return;
    try {
      await adminDeleteGuide(guide.id);
      router.replace("/admin/guides");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <form className={`${styles.form} ${styles.formWide}`} onSubmit={onSubmit}>
      {error ? <p className={styles.error}>{error}</p> : null}
      {message ? <p className={styles.okNote}>{message}</p> : null}

      <div className={styles.row}>
        <label>
          Title (English)
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            required
            maxLength={300}
          />
        </label>
        <label>
          Slug
          <input
            value={form.slug}
            onChange={(e) => update("slug", e.target.value)}
            placeholder="auto from title if empty"
            maxLength={220}
          />
        </label>
      </div>

      <label>
        Excerpt (English, shown on cards and as the default meta description)
        <textarea
          value={form.excerpt}
          onChange={(e) => update("excerpt", e.target.value)}
          rows={2}
          maxLength={600}
        />
      </label>

      <div className={styles.importBox}>
        <h3 className={styles.sectionTitle} style={{ marginTop: 0 }}>
          AI writing help (optional)
        </h3>
        <p className={styles.hint}>
          <strong>Generate draft</strong> writes a new guide from a topic and the products you pick.{" "}
          <strong>Rewrite &amp; expand</strong> turns the current body into a fuller guide (about
          1,600–2,400 words) and keeps its product cards. The AI is told never to invent hands-on
          testing, so the most human detail comes from your notes below.
        </p>
        <label>
          Topic
          <input
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            placeholder="e.g. How to choose an air fryer for a family of four"
            maxLength={300}
          />
        </label>
        <label>
          Editor notes (optional, used by both buttons)
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={4}
            placeholder={
              "Your own experience, angle and facts to include, e.g.\n" +
              "- I use a 5.8 qt basket model for two people; anything smaller was a hassle\n" +
              "- Readers keep asking whether oven-style models are harder to clean\n" +
              "- Budget focus: most people should not spend over $120"
            }
          />
        </label>
        {categoryProducts.length > 0 ? (
          <div>
            <p className={styles.hint}>Products to reference ({aiSlugs.length} selected):</p>
            <div className={styles.importActions}>
              {categoryProducts.slice(0, 30).map((product) => (
                <label key={product.id} style={{ display: "flex", gap: "0.4rem", fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={aiSlugs.includes(product.slug)}
                    onChange={() => toggleAiSlug(product.slug)}
                  />
                  <span>{product.title}</span>
                </label>
              ))}
            </div>
          </div>
        ) : form.categoryId ? (
          <p className={styles.hint}>No published products in this category yet.</p>
        ) : (
          <p className={styles.hint}>Select a category to list products to reference.</p>
        )}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.buttonSecondary}
            onClick={onDraft}
            disabled={drafting}
          >
            {drafting ? "Drafting…" : "Generate draft with AI"}
          </button>
          <button
            type="button"
            className={styles.buttonSecondary}
            onClick={onRewrite}
            disabled={rewriting || drafting || !form.body.trim()}
          >
            {rewriting ? "Rewriting… (up to 2 min)" : "Rewrite & expand current guide"}
          </button>
        </div>
      </div>

      <label>
        Body (English, Markdown)
        <textarea
          value={form.body}
          onChange={(e) => update("body", e.target.value)}
          rows={22}
          required
          placeholder={"## What to check before you buy\n\n- Point one\n- Point two\n\nLinks to Amazon get rel=sponsored automatically."}
          style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
        />
      </label>
      <p className={styles.hint}>
        <strong>{wordCount(form.body).toLocaleString("en-US")} words</strong>
        {wordCount(form.body) < 1200 ? " · readers find guides under ~1,200 words thin" : ""}.{" "}
        Markdown (GFM) is supported: headings (##), lists, tables, links, images.
        Raw HTML is not rendered. Do not paste Amazon product descriptions verbatim.
        Put <code>{"{{product:slug}}"}</code> on its own line to embed a product card.
      </p>
      {categoryProducts.length > 0 ? (
        <div className={styles.row}>
          <label>
            Insert product card
            <select value={pickedSlug} onChange={(e) => insertShortcode(e.target.value)}>
              <option value="">Choose a product…</option>
              {categoryProducts.map((product) => (
                <option key={product.id} value={product.slug}>
                  {product.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      <div className={styles.row}>
        <label>
          Category
          <select
            value={form.categoryId}
            onChange={(e) => update("categoryId", e.target.value)}
          >
            <option value="">(none)</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value as GuideStatus)}
          >
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
          </select>
        </label>
      </div>

      <div className={styles.row}>
        <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => update("featured", e.target.checked)}
          />
          Feature on homepage (leads the magazine section when published)
        </label>
        <label>
          Homepage rank (lower shows first)
          <input
            type="number"
            min={0}
            max={999}
            value={form.featuredRank}
            onChange={(e) => update("featuredRank", e.target.value)}
            disabled={!form.featured}
          />
        </label>
      </div>
      <p className={styles.hint}>
        The homepage leads with featured guides by rank, then the newest published guides. The first
        one becomes the large lead story, so give it a cover image if you can.
      </p>

      <div className={styles.row}>
        <label>
          Cover image URL (optional)
          <input
            value={form.coverImageUrl}
            onChange={(e) => update("coverImageUrl", e.target.value)}
            placeholder="https://…"
          />
        </label>
        <label>
          Author name
          <input
            value={form.authorName}
            onChange={(e) => update("authorName", e.target.value)}
            maxLength={120}
          />
        </label>
      </div>

      <h3 className={styles.sectionTitle}>Korean version (optional)</h3>
      <p className={styles.hint}>
        Leave empty to show the English guide with an &quot;English only&quot; notice on ?hl=ko.
      </p>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.buttonSecondary}
          onClick={onTranslate}
          disabled={translating}
        >
          {translating ? "Translating…" : "Translate English → Korean with AI"}
        </button>
      </div>
      <label>
        Title (Korean)
        <input
          value={form.titleKo}
          onChange={(e) => update("titleKo", e.target.value)}
          maxLength={300}
        />
      </label>
      <label>
        Excerpt (Korean)
        <textarea
          value={form.excerptKo}
          onChange={(e) => update("excerptKo", e.target.value)}
          rows={2}
          maxLength={600}
        />
      </label>
      <label>
        Body (Korean, Markdown)
        <textarea
          value={form.bodyKo}
          onChange={(e) => update("bodyKo", e.target.value)}
          rows={14}
          style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
        />
      </label>

      <h3 className={styles.sectionTitle}>SEO (optional)</h3>
      <label>
        SEO title
        <input
          value={form.seoTitle}
          onChange={(e) => update("seoTitle", e.target.value)}
          maxLength={255}
          placeholder="Defaults to the title + site name"
        />
      </label>
      <label>
        SEO description
        <textarea
          value={form.seoDescription}
          onChange={(e) => update("seoDescription", e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Defaults to the excerpt"
        />
      </label>

      <div className={styles.actions}>
        <button className={styles.button} type="submit" disabled={saving}>
          {saving ? "Saving…" : guide ? "Save changes" : "Create guide"}
        </button>
        {guide ? (
          <>
            <a
              className={styles.buttonSecondary}
              href={`/guides/${guide.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              View public page
            </a>
            <button
              className={styles.buttonDanger}
              type="button"
              onClick={onDelete}
            >
              Delete
            </button>
          </>
        ) : null}
      </div>
    </form>
  );
}
