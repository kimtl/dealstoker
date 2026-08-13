"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  adminCreateCategory,
  adminDeleteCategory,
  adminListCategories,
  adminUpdateCategory,
} from "@/lib/admin-api";
import type { Category } from "@/lib/types";
import styles from "../admin.module.css";

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  seoTitle: "",
  seoDescription: "",
  sortOrder: "0",
  active: true,
};

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const data = await adminListCategories();
    setItems(data);
  }

  useEffect(() => {
    load().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load"),
    );
  }, []);

  function startEdit(category: Category) {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      seoTitle: category.seoTitle || "",
      seoDescription: category.seoDescription || "",
      sortOrder: String(category.sortOrder ?? 0),
      active: category.active,
    });
    setMessage(null);
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const body = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim() || undefined,
      seoTitle: form.seoTitle.trim() || undefined,
      seoDescription: form.seoDescription.trim() || undefined,
      sortOrder: Number(form.sortOrder) || 0,
      active: form.active,
    };
    try {
      if (editingId) {
        await adminUpdateCategory(editingId, body);
        setMessage("Category updated.");
      } else {
        await adminCreateCategory(body);
        setMessage("Category created.");
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this category?")) return;
    try {
      await adminDeleteCategory(id);
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div>
      <h1 className={styles.title}>Categories</h1>
      {error ? <p className={styles.error}>{error}</p> : null}
      {message ? <p className={styles.muted}>{message}</p> : null}

      <div className={styles.card}>
        <h2>{editingId ? `Edit #${editingId}` : "Create category"}</h2>
        <form className={styles.form} onSubmit={onSubmit}>
          <label>
            Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label>
            Slug
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="auto from name if empty"
            />
          </label>
          <label>
            Description
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </label>
          <div className={styles.row}>
            <label>
              SEO title
              <input
                value={form.seoTitle}
                onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
              />
            </label>
            <label>
              Sort order
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: e.target.value })
                }
              />
            </label>
          </div>
          <label>
            SEO description
            <textarea
              value={form.seoDescription}
              onChange={(e) =>
                setForm({ ...form, seoDescription: e.target.value })
              }
            />
          </label>
          <label>
            <span>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm({ ...form, active: e.target.checked })
                }
              />{" "}
              Active
            </span>
          </label>
          <div className={styles.actions}>
            <button className={styles.button} type="submit">
              {editingId ? "Update" : "Create"}
            </button>
            {editingId ? (
              <button
                className={styles.buttonSecondary}
                type="button"
                onClick={resetForm}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Slug</th>
              <th>Order</th>
              <th>Active</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((category) => (
              <tr key={category.id}>
                <td>{category.id}</td>
                <td>{category.name}</td>
                <td>{category.slug}</td>
                <td>{category.sortOrder}</td>
                <td>{category.active ? "Yes" : "No"}</td>
                <td>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.buttonSecondary}
                      onClick={() => startEdit(category)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={styles.buttonDanger}
                      onClick={() => onDelete(category.id)}
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
