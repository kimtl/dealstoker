"use client";

import { API_PROXY_PREFIX } from "./site";
import type {
  Category,
  CategoryRequest,
  PageResponse,
  ProductDetail,
  ProductRequest,
  ProductStatus,
  ProductSummary,
} from "./types";

const AUTH_KEY = "dealstoker_admin_auth";

export function getStoredAuth(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(AUTH_KEY);
}

export function setStoredAuth(username: string, password: string): void {
  const token = btoa(`${username}:${password}`);
  sessionStorage.setItem(AUTH_KEY, token);
}

export function clearStoredAuth(): void {
  sessionStorage.removeItem(AUTH_KEY);
}

export function hasStoredAuth(): boolean {
  return Boolean(getStoredAuth());
}

async function adminFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const auth = getStoredAuth();
  if (!auth) {
    throw new Error("Not authenticated");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Basic ${auth}`);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(
    `${API_PROXY_PREFIX}${path.startsWith("/") ? path : `/${path}`}`,
    { ...init, headers },
  );

  if (res.status === 401) {
    clearStoredAuth();
    throw new Error("Unauthorized — check admin username/password (Railway ADMIN_PASSWORD)");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let detail = text;
    try {
      const json = JSON.parse(text) as { message?: string; error?: string };
      detail = json.message || json.error || text;
    } catch {
      // keep raw text
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export async function adminMe(): Promise<{ role: string }> {
  return adminFetch("/api/v1/admin/me");
}

export async function adminListCategories(): Promise<Category[]> {
  return adminFetch("/api/v1/admin/categories");
}

export async function adminCreateCategory(
  body: CategoryRequest,
): Promise<Category> {
  return adminFetch("/api/v1/admin/categories", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function adminUpdateCategory(
  id: number,
  body: CategoryRequest,
): Promise<Category> {
  return adminFetch(`/api/v1/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function adminDeleteCategory(id: number): Promise<void> {
  await adminFetch(`/api/v1/admin/categories/${id}`, { method: "DELETE" });
}

export async function adminListProducts(params?: {
  status?: ProductStatus;
  page?: number;
  size?: number;
}): Promise<PageResponse<ProductSummary>> {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.page !== undefined) search.set("page", String(params.page));
  if (params?.size !== undefined) search.set("size", String(params.size));
  const qs = search.toString();
  return adminFetch(`/api/v1/admin/products${qs ? `?${qs}` : ""}`);
}

export async function adminGetProduct(id: number): Promise<ProductDetail> {
  return adminFetch(`/api/v1/admin/products/${id}`);
}

export async function adminCreateProduct(
  body: ProductRequest,
): Promise<ProductDetail> {
  return adminFetch("/api/v1/admin/products", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function adminUpdateProduct(
  id: number,
  body: ProductRequest,
): Promise<ProductDetail> {
  return adminFetch(`/api/v1/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function adminPublishProduct(id: number): Promise<ProductDetail> {
  return adminFetch(`/api/v1/admin/products/${id}/publish`, { method: "POST" });
}

export async function adminUnpublishProduct(
  id: number,
): Promise<ProductDetail> {
  return adminFetch(`/api/v1/admin/products/${id}/unpublish`, {
    method: "POST",
  });
}

export async function adminFeatureProduct(
  id: number,
  body: { featured: boolean; featuredRank?: number | null } = { featured: true },
): Promise<ProductDetail> {
  return adminFetch(`/api/v1/admin/products/${id}/feature`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function adminDeleteProduct(id: number): Promise<void> {
  await adminFetch(`/api/v1/admin/products/${id}`, { method: "DELETE" });
}
