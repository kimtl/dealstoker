"use client";

import { API_PROXY_PREFIX } from "./site";
import type {
  AmazonImportPreview,
  AnalyticsSummary,
  Category,
  CategoryRequest,
  GuideDetail,
  GuideDraftRequest,
  GuideDraftResponse,
  GuideRequest,
  GuideRewriteRequest,
  GuideStatus,
  GuideSummary,
  GuideTranslateResponse,
  KeywordRegisterResponse,
  KeywordSearchResponse,
  PageResponse,
  PriceRefreshStatus,
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

export async function adminGenerateCategoryBuyingGuide(
  id: number,
  prompt?: string,
): Promise<{ buyingGuide: string }> {
  return adminFetch(`/api/v1/admin/categories/${id}/buying-guide/generate`, {
    method: "POST",
    body: JSON.stringify({ prompt: prompt?.trim() || null }),
  });
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

export async function adminPreviewAmazonImport(
  amazonUrl: string,
): Promise<AmazonImportPreview> {
  return adminFetch("/api/v1/admin/products/import/preview", {
    method: "POST",
    body: JSON.stringify({ amazonUrl }),
  });
}

export async function adminImportAmazonProduct(body: {
  amazonUrl: string;
  primaryCategoryId: number;
  affiliateUrl?: string;
  titleOverride?: string;
  createAsDraft?: boolean;
}): Promise<ProductDetail> {
  return adminFetch("/api/v1/admin/products/import", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function adminPriceRefreshStatus(): Promise<PriceRefreshStatus> {
  return adminFetch("/api/v1/admin/prices/status");
}

/** Starts the Amazon price refresh in the background (409 if one is already running). */
export async function adminStartPriceRefresh(): Promise<PriceRefreshStatus> {
  return adminFetch("/api/v1/admin/prices/refresh", { method: "POST" });
}

export async function adminResyncAmazonProduct(
  id: number,
): Promise<ProductDetail> {
  return adminFetch(`/api/v1/admin/products/${id}/resync-amazon`, {
    method: "POST",
  });
}

export async function adminKeywordSearch(body: {
  keywords: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  minDiscountPercent?: number | null;
  minRating?: number | null;
  minReviewCount?: number | null;
  maxPerKeyword?: number;
  includeSponsored?: boolean;
  includeExisting?: boolean;
}): Promise<KeywordSearchResponse> {
  return adminFetch("/api/v1/admin/products/import/keyword-search", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function adminKeywordRegister(body: {
  items: Array<{ asin: string; primaryCategoryId: number }>;
}): Promise<KeywordRegisterResponse> {
  return adminFetch("/api/v1/admin/products/import/keyword-register", {
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

export async function adminUpdateRecommendation(
  id: number,
  recommendation: string | null,
): Promise<ProductDetail> {
  return adminFetch(`/api/v1/admin/products/${id}/recommendation`, {
    method: "PUT",
    body: JSON.stringify({ recommendation }),
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

export async function adminGenerateRecommendation(
  id: number,
  save = true,
  notes?: string | null,
): Promise<ProductDetail> {
  return adminFetch(
    `/api/v1/admin/products/${id}/recommendation/generate?save=${save ? "true" : "false"}`,
    { method: "POST", body: JSON.stringify({ notes: notes?.trim() || null }) },
  );
}

export type GenerateMissingRecommendationsResult = {
  attempted: number;
  updated: number;
  failed: number;
  results: Array<{
    id: number;
    title: string;
    ok: boolean;
    error?: string;
  }>;
};

/** Fills missing notes; with rewriteTemplated, also rewrites published notes on the old template. */
export async function adminGenerateMissingRecommendations(
  limit = 20,
  rewriteTemplated = false,
): Promise<GenerateMissingRecommendationsResult> {
  return adminFetch(
    `/api/v1/admin/products/recommendation/generate-missing?limit=${limit}&rewriteTemplated=${rewriteTemplated}`,
    { method: "POST" },
  );
}

export async function adminAnalyticsSummary(
  days = 7,
): Promise<AnalyticsSummary> {
  return adminFetch(`/api/v1/admin/analytics/summary?days=${days}`);
}

// ---------- guides ----------

export async function adminListGuides(
  params: { status?: GuideStatus; page?: number; size?: number } = {},
): Promise<PageResponse<GuideSummary>> {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.size !== undefined) search.set("size", String(params.size));
  const qs = search.toString();
  return adminFetch(`/api/v1/admin/guides${qs ? `?${qs}` : ""}`);
}

export async function adminGetGuide(id: number): Promise<GuideDetail> {
  return adminFetch(`/api/v1/admin/guides/${id}`);
}

export async function adminCreateGuide(body: GuideRequest): Promise<GuideDetail> {
  return adminFetch("/api/v1/admin/guides", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function adminUpdateGuide(
  id: number,
  body: GuideRequest,
): Promise<GuideDetail> {
  return adminFetch(`/api/v1/admin/guides/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function adminPublishGuide(id: number): Promise<GuideDetail> {
  return adminFetch(`/api/v1/admin/guides/${id}/publish`, { method: "POST" });
}

export async function adminUnpublishGuide(id: number): Promise<GuideDetail> {
  return adminFetch(`/api/v1/admin/guides/${id}/unpublish`, { method: "POST" });
}

export async function adminDeleteGuide(id: number): Promise<void> {
  await adminFetch(`/api/v1/admin/guides/${id}`, { method: "DELETE" });
}

export async function adminDraftGuide(body: GuideDraftRequest): Promise<GuideDraftResponse> {
  return adminFetch("/api/v1/admin/guides/draft", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** AI rewrite of the current English guide into a fuller, more natural one. Nothing is saved. */
export async function adminRewriteGuide(body: GuideRewriteRequest): Promise<GuideDraftResponse> {
  return adminFetch("/api/v1/admin/guides/rewrite", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function adminTranslateGuide(body: {
  title: string;
  excerpt?: string | null;
  body: string;
}): Promise<GuideTranslateResponse> {
  return adminFetch("/api/v1/admin/guides/translate", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Published products of a category, for the shortcode picker (public endpoint). */
export async function adminListCategoryProducts(
  categorySlug: string,
): Promise<PageResponse<ProductSummary>> {
  return adminFetch(
    `/api/v1/products?category=${encodeURIComponent(categorySlug)}&size=100&sort=newest`,
  );
}
