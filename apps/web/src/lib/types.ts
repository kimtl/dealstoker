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
  buyingGuide?: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  sortOrder: number;
  active: boolean;
  updatedAt?: string | null;
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
  viewCount?: number | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
};

export type AnalyticsDailyStat = {
  date: string;
  pageViews: number;
  visitors: number;
  sessions: number;
  productViews: number;
  outboundClicks: number;
};

export type AnalyticsProductStat = {
  productId: number;
  slug: string;
  title: string;
  views: number;
  clicks: number;
};

export type AnalyticsSummary = {
  rangeDays: number;
  pageViews: number;
  uniqueVisitors: number;
  uniqueSessions: number;
  productViews: number;
  outboundClicks: number;
  daily: AnalyticsDailyStat[];
  topProducts: AnalyticsProductStat[];
};

export type ProductDetail = {
  id: number;
  source: string | null;
  externalId: string;
  marketplace: string | null;
  title: string;
  slug: string;
  description: string | null;
  recommendation: string | null;
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
  updatedAt?: string | null;
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
  topViewDeals?: ProductSummary[];
  /** @deprecated Prefer topViewDeals */
  topBuyDeals?: ProductSummary[];
  latestDeals?: ProductSummary[];
  featuredProducts: ProductSummary[];
};

export type CategoryRequest = {
  parentId?: number | null;
  name: string;
  slug?: string;
  description?: string;
  buyingGuide?: string | null;
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
  recommendation?: string;
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

export type AmazonImportPreview = {
  asin: string;
  canonicalUrl: string;
  title: string | null;
  imageUrl: string | null;
  description: string | null;
  brand: string | null;
  priceAmount: number | string | null;
  listPrice: number | string | null;
  currency: string | null;
  rating: number | string | null;
  reviewCount: number | null;
  features: string[];
  marketplace: string;
  pageFetched: boolean;
  note: string | null;
  alreadyExists: boolean;
  existingProductId: number | null;
};

export type KeywordSearchHit = {
  asin: string;
  title: string;
  imageUrl: string | null;
  productUrl: string;
  keyword: string;
  priceAmount: number | string | null;
  listPrice: number | string | null;
  discountPercent: number | string | null;
  rating: number | string | null;
  reviewCount: number | null;
  sponsored: boolean;
  alreadyExists: boolean;
  existingProductId: number | null;
  suggestedCategoryId: number | null;
  suggestedCategoryName: string | null;
};

export type KeywordSearchResponse = {
  items: KeywordSearchHit[];
  keywordCount: number;
  rawHitCount: number;
  matchedCount: number;
  notes: string[];
};

export type KeywordRegisterResponse = {
  attempted: number;
  created: number;
  failed: number;
  results: Array<{
    asin: string;
    ok: boolean;
    productId: number | null;
    title: string | null;
    error: string | null;
  }>;
};

export type GuideStatus = "DRAFT" | "PUBLISHED";

export type GuideSummary = {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  titleKo: string | null;
  excerptKo: string | null;
  coverImageUrl: string | null;
  authorName: string | null;
  categoryId: number | null;
  categorySlug: string | null;
  categoryName: string | null;
  status: GuideStatus;
  /** Editor-picked guides lead the homepage (lower featuredRank first). */
  featured?: boolean;
  featuredRank?: number;
  publishedAt: string | null;
  updatedAt: string | null;
  /** Human page views, all time (admin list only). */
  viewCount?: number | null;
  /** Human page views in the last 7 days (admin list only). */
  viewCount7d?: number | null;
};

export type GuideDetail = GuideSummary & {
  body: string;
  bodyKo: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string | null;
};

export type GuideRequest = {
  title: string;
  slug?: string | null;
  excerpt?: string | null;
  body: string;
  titleKo?: string | null;
  excerptKo?: string | null;
  bodyKo?: string | null;
  categoryId?: number | null;
  coverImageUrl?: string | null;
  authorName?: string | null;
  status?: GuideStatus;
  seoTitle?: string | null;
  seoDescription?: string | null;
  featured?: boolean;
  featuredRank?: number;
};

/** A guide plus the published products its body embeds, in body order. */
export type MagazineStory = {
  guide: GuideSummary;
  products: ProductSummary[];
};

export type MagazineSection = {
  categoryId: number;
  categorySlug: string;
  categoryName: string;
  guides: GuideSummary[];
  products: ProductSummary[];
};

/** Guide-led homepage data from GET /api/v1/home/magazine. */
export type MagazineResponse = {
  publishedGuides: number;
  stories: MagazineStory[];
  sections: MagazineSection[];
  moreGuides: GuideSummary[];
};

export type GuideDraftRequest = {
  categoryId?: number | null;
  topic?: string | null;
  productSlugs?: string[];
  prompt?: string | null;
};

export type GuideDraftResponse = {
  title: string;
  excerpt: string | null;
  body: string;
};

export type GuideTranslateResponse = {
  titleKo: string | null;
  excerptKo: string | null;
  bodyKo: string;
};
