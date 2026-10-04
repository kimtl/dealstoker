import type { Locale } from "./locale";

export type Messages = {
  langName: string;
  searchDeals: string;
  searchPlaceholder: string;
  search: string;
  primaryNav: string;
  homeAria: string;
  footerNav: string;
  about: string;
  disclosure: string;
  privacy: string;
  contact: string;
  fullDisclosure: string;
  affiliateShort: string;
  footerTagline: string;
  language: string;
  languageEn: string;
  languageKo: string;

  featuredDeals: string;
  allDeals: string;
  topViews: string;
  latestDeals: string;
  categories: string;
  featured: string;
  trending: string;
  updated: string;
  frontpageSections: string;
  homeHeadline: string;
  homeSupport: string;
  homeIntro1: string;
  homeIntro2: string;
  featuredMeta: string;
  topViewsMeta: string;
  latestMeta: string;
  emptyFeatured: string;
  emptyTopViews: string;
  emptyLatest: string;
  livePick: string;
  livePicks: string;

  frontpage: string;
  buyingGuide: string;
  buyingGuideTitle: string;
  dealsCount: string;
  dealCount: string;
  newest: string;
  priceAsc: string;
  priceDesc: string;
  topRated: string;
  sortNav: string;
  previous: string;
  next: string;
  pageOf: string;
  emptyCategory: string;
  categoryLead: string;

  viewOnAmazon: string;
  curatedBy: string;
  whyRecommend: string;
  curationByline: string;
  relatedDeals: string;
  views: string;
  view: string;
  newBadge: string;
  featuredBadge: string;
  faqTitle: string;
  breadcrumbHome: string;
  stars: string;
  reviews: string;
  breadcrumb: string;

  searchPageTitle: string;
  searchPageLead: string;
  searchActiveLead: string;
  searchEmpty: string;
  searchHint: string;
  filters: string;
  keywords: string;
  productOrBrand: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  anyPrice: string;
  applyFilters: string;
  clearFilters: string;
  allCategories: string;
  resultsForQ: string;
  categoryDealsTitle: string;
  filteredDeals: string;
  resultOne: string;
  resultMany: string;
  unitedStates: string;

  aboutTitle: string;
  aboutLead: string;
  aboutP1: string;
  aboutMissionTitle: string;
  aboutMission: string;
  aboutFindTitle: string;
  aboutFeaturedItem: string;
  aboutTopViewsItem: string;
  aboutCategoryItem: string;
  aboutProductItem: string;
  aboutChooseTitle: string;
  aboutChoose: string;
  aboutAffiliateTitle: string;
  aboutAffiliate: string;

  contactTitle: string;
  contactLead: string;
  contactBody: string;

  disclosureTitle: string;
  disclosureLead: string;
  disclosureBody: string;

  privacyTitle: string;
  privacyLead: string;
  privacyBody: string;

  noDealsYet: string;
  closeBuyingGuide: string;

  notFoundTitle: string;
  notFoundBody: string;
  notFoundHome: string;
  notFoundBrowse: string;

  guides: string;
  guidesTitle: string;
  guidesLead: string;
  readGuide: string;
  guideBy: string;
  guideEnglishOnly: string;
  guidesForCategory: string;
  allGuides: string;
  emptyGuides: string;
  guideReadingTime: string;
  guideBrowseDeals: string;
  guideCount: string;
  guidesCount: string;
  latestGuides: string;
  latestGuidesMeta: string;
};

const en: Messages = {
  langName: "English",
  searchDeals: "Search deals",
  searchPlaceholder: "Search deals…",
  search: "Search",
  primaryNav: "Primary",
  homeAria: "home",
  footerNav: "Footer",
  about: "About",
  disclosure: "Affiliate Disclosure",
  privacy: "Privacy",
  contact: "Contact",
  fullDisclosure: "Full disclosure",
  affiliateShort:
    "As an Amazon Associate I earn from qualifying purchases.",
  footerTagline:
    "Curated Amazon.com picks for US shoppers — practical deals, clear context, no noise.",
  language: "Language",
  languageEn: "EN",
  languageKo: "한국어",

  featuredDeals: "Featured deals",
  allDeals: "All deals",
  topViews: "Top views",
  latestDeals: "Latest deals",
  categories: "Categories",
  featured: "Featured",
  trending: "Trending",
  updated: "Updated",
  frontpageSections: "Frontpage sections",
  homeHeadline: "Amazon deals, price drops & featured deals",
  homeSupport:
    "Curated Amazon.com deals for US shoppers — featured deals, clear prices, and less noise.",
  homeIntro1:
    "{site} tracks Amazon deals and price drops across home, electronics, outdoor, and everyday categories so US shoppers can compare featured deals without hunting through noisy marketplaces.",
  homeIntro2:
    "Each listing highlights the current Amazon.com price first, then adds rating signals and our short editorial notes when a product earns a featured deals slot or climbs the top-views ranking.",
  featuredMeta: "Featured by DealStoker · up to 5 deals",
  topViewsMeta: "Most-viewed product pages · last 7 days · top 5",
  latestMeta: "{count} live pick{suffix} · Amazon",
  emptyFeatured: "No featured deals yet. Mark products as featured in Admin.",
  emptyTopViews:
    "No product views yet. Rankings appear as shoppers browse deals.",
  emptyLatest: "No published deals yet. Check back soon.",
  livePick: "",
  livePicks: "s",

  frontpage: "Frontpage",
  buyingGuide: "Buying guide",
  buyingGuideTitle: "{name} buying guide",
  dealsCount: "{count} deals",
  dealCount: "{count} deal",
  newest: "Newest",
  priceAsc: "Price ↑",
  priceDesc: "Price ↓",
  topRated: "Top rated",
  sortNav: "Sort",
  previous: "Previous",
  next: "Next",
  pageOf: "Page {page} of {total}",
  emptyCategory: "No published deals in this category yet.",
  categoryLead:
    "Browse the best {name} deals on Amazon.com. {site} lists current prices, price drops, and featured picks for US shoppers.",

  viewOnAmazon: "View on Amazon",
  curatedBy:
    "Curated by {site}. Price and availability may change on Amazon.com.",
  whyRecommend: "Why we recommend it",
  curationByline: "by {site} curation team",
  relatedDeals: "Related deals",
  views: "views",
  view: "view",
  newBadge: "New",
  featuredBadge: "Featured",
  faqTitle: "Frequently asked questions",
  breadcrumbHome: "Home",
  stars: "stars",
  reviews: "reviews",
  breadcrumb: "Breadcrumb",

  searchPageTitle: "Search deals",
  searchPageLead:
    "Search by keyword, pick a category, or set a price range to find deals on {site}.",
  searchActiveLead:
    "Browse curated Amazon.com deals on {site} with your selected filters.",
  searchEmpty:
    "No deals matched these filters. Try another category, price range, or keyword.",
  searchHint:
    "Use the filters above, or search from the header, to see matching deals.",
  filters: "Filters",
  keywords: "Keywords",
  productOrBrand: "Product or brand",
  category: "Category",
  minPrice: "Min price",
  maxPrice: "Max price",
  anyPrice: "Any",
  applyFilters: "Apply filters",
  clearFilters: "Clear",
  allCategories: "All categories",
  resultsForQ: "Results for “{q}”",
  categoryDealsTitle: "{name} deals",
  filteredDeals: "Filtered deals",
  resultOne: "{count} result",
  resultMany: "{count} results",
  unitedStates: "United States",

  aboutTitle: "About {site}",
  aboutLead: "Amazon deal curation for online shoppers in the United States.",
  aboutP1:
    "{site} ({domain}) is an Amazon deal curation site built for US online shoppers. Since 2026, we have helped shoppers find practical products faster — and thousands of people visit {site} every day looking for the best deals.",
  aboutMissionTitle: "Our mission",
  aboutMission:
    "Cut the noise. Show shoppers only the deals worth their time. Amazon is full of options; {site} focuses on clear prices, useful context, and products that make sense for everyday US buyers.",
  aboutFindTitle: "What you will find",
  aboutFeaturedItem:
    "Featured deals — editor-selected products we think are worth a look right now.",
  aboutTopViewsItem:
    "Top views — deals shoppers browse most often on product pages.",
  aboutCategoryItem:
    "Category pages — curated lists across Home & Kitchen, Electronics, Outdoor & Sports, Health & Household, Pets, and more.",
  aboutProductItem:
    "Product pages — why we recommend the pick, key features when available, and a clear path to view the item on Amazon.com.",
  aboutChooseTitle: "How we choose products",
  aboutChoose:
    "Editors review ratings, review volume, usefulness, and price positioning before a product is published. We favor clear use cases over hype. Listings can be updated or unpublished when availability or quality signals change. Prices shown on {site} may differ from the live price on Amazon.com at the moment you buy.",
  aboutAffiliateTitle: "Affiliate relationship",
  aboutAffiliate:
    "{site} is a participant in the Amazon Services LLC Associates Program. As an Amazon Associate, we may earn a commission when you buy through our links, at no extra cost to you.",

  contactTitle: "Contact",
  contactLead: "Get in touch with the DealStoker team.",
  contactBody:
    "Questions about a listing, partnership ideas, or privacy requests? Email hello@{domain}. For privacy-specific requests, use privacy@{domain}.",

  disclosureTitle: "Affiliate Disclosure",
  disclosureLead: "How DealStoker earns commissions.",
  disclosureBody:
    "DealStoker is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. Prices and availability are accurate as of the time of writing and may change.",

  privacyTitle: "Privacy Policy",
  privacyLead: "How we handle information on DealStoker.",
  privacyBody:
    "We collect limited analytics such as page views and outbound clicks to improve DealStoker. We do not sell personal information. Contact privacy@{domain} for privacy requests.",

  noDealsYet: "No deals yet.",
  closeBuyingGuide: "Close buying guide",
  notFoundTitle: "Page not found",
  notFoundBody: "That page is gone or the product is unpublished.",
  notFoundHome: "Back to the homepage",
  notFoundBrowse: "Browse all deals",

  guides: "Guides",
  guidesTitle: "Buying guides",
  guidesLead:
    "Original, practical guides on what to check before you buy on Amazon.com, written by the DealStoker curation team.",
  readGuide: "Read guide",
  guideBy: "By {name}",
  guideEnglishOnly: "This guide is currently available in English only.",
  guidesForCategory: "{name} buying guides",
  allGuides: "All guides",
  emptyGuides: "No guides yet. Check back soon.",
  guideReadingTime: "{minutes} min read",
  guideBrowseDeals: "Browse {name} deals",
  guideCount: "{count} guide",
  guidesCount: "{count} guides",
  latestGuides: "Buying guides",
  latestGuidesMeta: "What to check before you buy · from the curation team",
};

const ko: Messages = {
  langName: "한국어",
  searchDeals: "딜 검색",
  searchPlaceholder: "딜 검색…",
  search: "검색",
  primaryNav: "주요 메뉴",
  homeAria: "홈",
  footerNav: "푸터",
  about: "소개",
  disclosure: "제휴 고지",
  privacy: "개인정보 처리방침",
  contact: "문의",
  fullDisclosure: "전체 고지 보기",
  affiliateShort:
    "Amazon Associates로서 적격 구매 시 수수료를 받을 수 있습니다.",
  footerTagline:
    "미국 쇼핑객을 위한 Amazon.com 큐레이션 — 실용적인 딜, 명확한 정보, 군더더기 없음.",
  language: "언어",
  languageEn: "EN",
  languageKo: "한국어",

  featuredDeals: "추천 딜",
  allDeals: "전체 딜",
  topViews: "인기 조회",
  latestDeals: "최신 딜",
  categories: "카테고리",
  featured: "추천",
  trending: "인기",
  updated: "업데이트",
  frontpageSections: "메인 섹션",
  homeHeadline: "아마존 딜, 할인 & 추천 딜",
  homeSupport:
    "미국 쇼핑객을 위한 Amazon.com 큐레이션 딜 — 추천 딜, 명확한 가격, 덜 복잡한 목록.",
  homeIntro1:
    "{site}는 홈·전자·아웃도어 등 카테고리의 아마존 딜과 할인을 모아, 미국 쇼핑객이 복잡한 마켓플레이스를 헤매지 않고 추천 딜을 비교할 수 있게 합니다.",
  homeIntro2:
    "각 상품은 Amazon.com 현재 가격을 먼저 보여 주고, 평점 신호와 함께 추천 딜·인기 조회 순위에 오른 상품에는 짧은 편집 코멘트를 더합니다.",
  featuredMeta: "DealStoker 추천 · 최대 5개",
  topViewsMeta: "최근 7일 가장 많이 본 상품 페이지 · 상위 5개",
  latestMeta: "라이브 {count}개 · Amazon",
  emptyFeatured: "추천 딜이 아직 없습니다. 관리자에서 상품을 추천으로 표시하세요.",
  emptyTopViews: "조회 기록이 아직 없습니다. 쇼핑객이 상품을 보면 순위가 나타납니다.",
  emptyLatest: "공개된 딜이 아직 없습니다. 잠시 후 다시 확인해 주세요.",
  livePick: "",
  livePicks: "",

  frontpage: "홈",
  buyingGuide: "구매 가이드",
  buyingGuideTitle: "{name} 구매 가이드",
  dealsCount: "딜 {count}개",
  dealCount: "딜 {count}개",
  newest: "최신순",
  priceAsc: "가격 ↑",
  priceDesc: "가격 ↓",
  topRated: "평점순",
  sortNav: "정렬",
  previous: "이전",
  next: "다음",
  pageOf: "{total}페이지 중 {page}",
  emptyCategory: "이 카테고리에 공개된 딜이 아직 없습니다.",
  categoryLead:
    "Amazon.com의 인기 {name} 딜을 둘러보세요. {site}는 미국 쇼핑객을 위해 현재 가격, 할인, 추천 상품을 정리합니다.",

  viewOnAmazon: "아마존에서 보기",
  curatedBy:
    "{site}가 큐레이션했습니다. 가격과 재고는 Amazon.com에서 변경될 수 있습니다.",
  whyRecommend: "추천 이유",
  curationByline: "{site} 큐레이션 팀",
  relatedDeals: "관련 딜",
  views: "회 조회",
  view: "회 조회",
  newBadge: "신규",
  featuredBadge: "추천",
  faqTitle: "자주 묻는 질문",
  breadcrumbHome: "홈",
  stars: "점",
  reviews: "리뷰",
  breadcrumb: "경로",

  searchPageTitle: "딜 검색",
  searchPageLead:
    "키워드·카테고리·가격대로 {site}의 딜을 찾아보세요.",
  searchActiveLead:
    "선택한 조건으로 {site}의 Amazon.com 큐레이션 딜을 둘러보세요.",
  searchEmpty:
    "조건에 맞는 딜이 없습니다. 카테고리, 가격대, 키워드를 바꿔 보세요.",
  searchHint:
    "위 필터를 사용하거나 헤더에서 검색하면 맞는 딜을 볼 수 있습니다.",
  filters: "필터",
  keywords: "키워드",
  productOrBrand: "상품 또는 브랜드",
  category: "카테고리",
  minPrice: "최저가",
  maxPrice: "최고가",
  anyPrice: "제한 없음",
  applyFilters: "필터 적용",
  clearFilters: "초기화",
  allCategories: "전체 카테고리",
  resultsForQ: "“{q}” 검색 결과",
  categoryDealsTitle: "{name} 딜",
  filteredDeals: "필터된 딜",
  resultOne: "결과 {count}개",
  resultMany: "결과 {count}개",
  unitedStates: "미국",

  aboutTitle: "{site} 소개",
  aboutLead: "미국 온라인 쇼핑객을 위한 아마존 딜 큐레이션.",
  aboutP1:
    "{site}({domain})는 미국 온라인 쇼핑객을 위한 아마존 딜 큐레이션 사이트입니다. 2026년부터 실용적인 상품을 더 빨리 찾도록 돕고 있으며, 매일 수천 명이 좋은 딜을 찾아 {site}를 방문합니다.",
  aboutMissionTitle: "미션",
  aboutMission:
    "잡음을 줄이고, 시간 들일 가치가 있는 딜만 보여 줍니다. 아마존에는 선택지가 많습니다. {site}는 명확한 가격, 유용한 맥락, 일상적인 미국 구매자에게 맞는 상품에 집중합니다.",
  aboutFindTitle: "무엇을 볼 수 있나요",
  aboutFeaturedItem: "추천 딜 — 지금 살펴볼 만한 편집자 선정 상품.",
  aboutTopViewsItem: "인기 조회 — 상품 페이지에서 가장 많이 본 딜.",
  aboutCategoryItem:
    "카테고리 페이지 — 홈&키친, 전자제품, 아웃도어&스포츠, 건강&생활, 반려동물 등.",
  aboutProductItem:
    "상품 페이지 — 추천 이유, 주요 특징, Amazon.com에서 바로 확인하는 경로.",
  aboutChooseTitle: "상품 선정 방식",
  aboutChoose:
    "편집자가 평점, 리뷰 수, 실용성, 가격 포지션을 검토한 뒤 공개합니다. 과대광고보다 명확한 사용 상황을 우선합니다. 재고·품질 신호가 바뀌면 목록을 수정하거나 비공개할 수 있습니다. {site}에 표시된 가격은 구매 시점의 Amazon.com 가격과 다를 수 있습니다.",
  aboutAffiliateTitle: "제휴 관계",
  aboutAffiliate:
    "{site}는 Amazon Services LLC Associates Program 참여자입니다. Amazon Associate로서 링크를 통한 구매 시 추가 비용 없이 수수료를 받을 수 있습니다.",

  contactTitle: "문의",
  contactLead: "DealStoker 팀에 연락하세요.",
  contactBody:
    "상품, 파트너십, 개인정보 관련 문의는 hello@{domain}으로 보내 주세요. 개인정보 요청은 privacy@{domain}을 이용해 주세요.",

  disclosureTitle: "제휴 고지",
  disclosureLead: "DealStoker의 수수료 안내.",
  disclosureBody:
    "DealStoker는 Amazon.com에 광고하고 링크하여 광고 수수료를 받을 수 있도록 마련된 Amazon Services LLC Associates Program 참여자입니다. 가격과 재고 정보는 작성 시점 기준이며 변경될 수 있습니다.",

  privacyTitle: "개인정보 처리방침",
  privacyLead: "DealStoker의 정보 처리 안내.",
  privacyBody:
    "서비스 개선을 위해 페이지 조회·아웃바운드 클릭 등 제한된 분석 정보를 수집합니다. 개인정보를 판매하지 않습니다. 개인정보 관련 요청은 privacy@{domain}으로 연락해 주세요.",

  noDealsYet: "딜이 아직 없습니다.",
  closeBuyingGuide: "구매 가이드 닫기",
  notFoundTitle: "페이지를 찾을 수 없습니다",
  notFoundBody: "페이지가 삭제되었거나 상품이 비공개 상태입니다.",
  notFoundHome: "홈으로 돌아가기",
  notFoundBrowse: "전체 딜 보기",

  guides: "가이드",
  guidesTitle: "구매 가이드",
  guidesLead:
    "Amazon.com에서 구매하기 전에 확인할 점을 DealStoker 큐레이션 팀이 직접 정리한 가이드입니다.",
  readGuide: "가이드 읽기",
  guideBy: "{name} 작성",
  guideEnglishOnly: "이 가이드는 현재 영어로만 제공됩니다.",
  guidesForCategory: "{name} 구매 가이드",
  allGuides: "전체 가이드",
  emptyGuides: "아직 가이드가 없습니다. 곧 추가될 예정입니다.",
  guideReadingTime: "약 {minutes}분",
  guideBrowseDeals: "{name} 딜 보기",
  guideCount: "가이드 {count}개",
  guidesCount: "가이드 {count}개",
  latestGuides: "구매 가이드",
  latestGuidesMeta: "구매 전 확인할 점 · 큐레이션 팀 작성",
};

export const dictionaries: Record<Locale, Messages> = { en, ko };

export const CATEGORY_NAME_KO: Record<string, string> = {
  "Home & Kitchen": "홈 & 키친",
  Electronics: "전자제품",
  "Outdoor & Sports": "아웃도어 & 스포츠",
  "Beauty & Personal Care": "뷰티 & 퍼스널케어",
  "Health & Household": "건강 & 생활",
  Baby: "베이비",
  Pets: "반려동물",
  "Office & School": "사무 & 학용",
  "Tools & Home Improvement": "공구 & 홈 임프루브먼트",
  "Fashion & Accessories": "패션 & 액세서리",
};

export function formatMessage(
  template: string,
  vars: Record<string, string | number> = {},
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] != null ? String(vars[key]) : "",
  );
}

export function localizeCategoryName(name: string, locale: Locale): string {
  if (locale !== "ko") return name;
  return CATEGORY_NAME_KO[name] || name;
}
