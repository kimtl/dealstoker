import { getApiBaseUrl } from "./site";
import type {
  Category,
  HomeResponse,
  PageResponse,
  ProductDetail,
  ProductSummary,
} from "./types";

type FetchOptions = {
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
  revalidate?: number | false;
};

async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const init: RequestInit & { next?: NextFetchRequestConfig } = {
    headers: {
      Accept: "application/json",
    },
  };

  if (options.cache) {
    init.cache = options.cache;
  } else if (options.revalidate === false) {
    init.cache = "no-store";
  } else if (typeof options.revalidate === "number") {
    init.next = { revalidate: options.revalidate };
  } else if (options.next) {
    init.next = options.next;
  } else {
    init.next = { revalidate: 60 };
  }

  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`API ${res.status} for ${path}`);
  }
  return res.json() as Promise<T>;
}

export async function getHome(): Promise<HomeResponse> {
  return apiFetch<HomeResponse>("/api/v1/home", { revalidate: 60 });
}

export async function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/api/v1/categories", { revalidate: 120 });
}

export async function getCategory(slug: string): Promise<Category> {
  return apiFetch<Category>(`/api/v1/categories/${encodeURIComponent(slug)}`, {
    revalidate: 120,
  });
}

export async function getCategoryProducts(
  slug: string,
  params: { sort?: string; page?: number; size?: number } = {},
): Promise<PageResponse<ProductSummary>> {
  const search = new URLSearchParams();
  if (params.sort) search.set("sort", params.sort);
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.size !== undefined) search.set("size", String(params.size));
  const qs = search.toString();
  return apiFetch<PageResponse<ProductSummary>>(
    `/api/v1/categories/${encodeURIComponent(slug)}/products${qs ? `?${qs}` : ""}`,
    { revalidate: 60 },
  );
}

export async function getProduct(slug: string): Promise<ProductDetail> {
  return apiFetch<ProductDetail>(
    `/api/v1/products/${encodeURIComponent(slug)}`,
    { revalidate: 60 },
  );
}

export async function getRelatedProducts(
  slug: string,
): Promise<ProductSummary[]> {
  return apiFetch<ProductSummary[]>(
    `/api/v1/products/${encodeURIComponent(slug)}/related`,
    { revalidate: 120 },
  );
}

export async function getSitemapXml(): Promise<string | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/sitemap.xml`, {
      next: { revalidate: 300 },
      headers: { Accept: "application/xml,text/xml,*/*" },
    });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}
