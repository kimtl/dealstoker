export type ProductStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "UNPUBLISHED"
  | "OUTDATED"
  | "BLOCKED";

export type Category = {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  sortOrder: number;
  active: boolean;
};

export type ProductSummary = {
  id: number;
  title: string;
  slug: string;
  imageUrl: string | null;
  priceAmount: number | string | null;
  listPrice?: number | string | null;
  currency: string | null;
  rating: number | string | null;
  reviewCount: number | null;
  brand: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  status: ProductStatus;
  featured?: boolean;
  featuredRank?: number;
  buyClickCount?: number | null;
};

export type ProductDetail = {
  id: number;
  source: string | null;
  externalId: string;
  marketplace: string | null;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  priceAmount: number | string | null;
  currency: string | null;
  listPrice: number | string | null;
  availability: string | null;
  rating: number | string | null;
  reviewCount: number | null;
  detailPageUrl: string;
  brand: string | null;
  features: string[];
  status: ProductStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  primaryCategoryId: number | null;
  categorySlug: string | null;
  categoryName: string | null;
  publishedAt: string | null;
  lastSyncedAt: string | null;
  featured?: boolean;
  featuredRank?: number;
};

export type PageResponse<T> = {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type HomeResponse = {
  categories: Category[];
  recommendedDeals?: ProductSummary[];
  topBuyDeals?: ProductSummary[];
  latestDeals?: ProductSummary[];
  featuredProducts: ProductSummary[];
};

export type CategoryRequest = {
  parentId?: number | null;
  name: string;
  slug?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  sortOrder?: number;
  active?: boolean;
};

export type ProductRequest = {
  externalId: string;
  source?: string;
  marketplace?: string;
  title: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  priceAmount?: number | null;
  currency?: string;
  listPrice?: number | null;
  availability?: string;
  rating?: number | null;
  reviewCount?: number | null;
  detailPageUrl: string;
  brand?: string;
  features?: string[];
  status?: ProductStatus;
  seoTitle?: string;
  seoDescription?: string;
  primaryCategoryId: number;
  featured?: boolean;
  featuredRank?: number;
};
