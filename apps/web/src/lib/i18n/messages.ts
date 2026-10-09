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
  /** Plain-language clarification: the fee is paid by Amazon, never by the shopper. */
  affiliateNoCost: string;
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
  priceAsOf: string;
  priceMayHaveChanged: string;
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
  atAGlance: string;
  newsletterTitle: string;
  newsletterLead: string;
  newsletterPlaceholder: string;
  newsletterSubmit: string;
  newsletterSending: string;
  newsletterCheckInbox: string;
  newsletterError: string;
  newsletterPrivacyNote: string;
  newsletterConfirmTitle: string;
  newsletterConfirmBody: string;
  newsletterConfirming: string;
  newsletterInvalidLink: string;
  newsletterUnsubTitle: string;
  newsletterUnsubBody: string;
  newsletterUnsubButton: string;
  newsletterUnsubDone: string;
  glanceDeals: string;
  glancePriceRange: string;
  glanceBiggestDiscount: string;
  biggestDiscount: string;
  glanceGuides: string;
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
  aboutIntro: string;
  aboutWhyTitle: string;
  aboutWhy: string;
  aboutFindTitle: string;
  aboutGuidesItem: string;
  aboutFeaturedItem: string;
  aboutTopViewsItem: string;
  aboutCategoryItem: string;
  aboutProductItem: string;
  aboutHowTitle: string;
  aboutHowPick: string;
  aboutHowAi: string;
  aboutHowPrices: string;
  aboutAffiliateTitle: string;
  aboutAffiliate: string;
  aboutFeedbackTitle: string;
  aboutFeedback: string;

  contactTitle: string;
  contactLead: string;
  contactBody: string;

  disclosureTitle: string;
  disclosureLead: string;
  disclosureBody: string;
  disclosureNoCostTitle: string;
  disclosureNoCostBody: string;
  disclosureIndependenceBody: string;

  privacyTitle: string;
  privacyLead: string;

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

  magazineHeadline: string;
  magazineSupport: string;
  storiesMeta: string;
  editorsPick: string;
  guidePicks: string;
  byCategory: string;
  categorySectionMeta: string;
  moreGuides: string;
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
  affiliateNoCost:
    "This never costs you extra: Amazon pays the referral fee, and you pay the same price as you would on Amazon directly.",
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
  priceAsOf: "Price as of",
  priceMayHaveChanged: "may have changed since",
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
  atAGlance: "At a glance",
  newsletterTitle: "Get the weekly picks",
  newsletterLead: "New buying guides and the week's biggest discounts, once a week. No spam, and you can unsubscribe anytime.",
  newsletterPlaceholder: "you@example.com",
  newsletterSubmit: "Subscribe",
  newsletterSending: "Sending…",
  newsletterCheckInbox: "Almost done: check your inbox and tap the confirmation link.",
  newsletterError: "Something went wrong. Please try again.",
  newsletterPrivacyNote: "We only use your email for the newsletter.",
  newsletterConfirmTitle: "You're subscribed",
  newsletterConfirmBody: "You'll get the next weekly issue. Every email has a one-click unsubscribe link.",
  newsletterConfirming: "Confirming your subscription…",
  newsletterInvalidLink: "This link is invalid or has already been used.",
  newsletterUnsubTitle: "Unsubscribe",
  newsletterUnsubBody: "Stop receiving the DealStoker weekly newsletter?",
  newsletterUnsubButton: "Unsubscribe",
  newsletterUnsubDone: "You're unsubscribed. We won't send you any more newsletters.",
  glanceDeals: "Deals",
  glancePriceRange: "Price range",
  glanceBiggestDiscount: "Biggest discount",
  biggestDiscount: "Biggest discount",
  glanceGuides: "Buying guides",
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
  aboutLead:
    "A small, independent site that helps US shoppers decide what is worth buying on Amazon.com.",
  aboutIntro:
    "{site} ({domain}) launched in 2026. We pick Amazon.com products that are worth a closer look, write buying guides about what to check before you buy, and show every price together with the time we last checked it. We are not part of Amazon and we do not sell anything ourselves: when you decide to buy, checkout, shipping, and returns all happen on Amazon.com.",
  aboutWhyTitle: "Why we started",
  aboutWhy:
    "Shopping on Amazon often means scrolling past sponsored results, near-identical listings, and \"discounts\" measured against list prices nobody actually pays. We wanted a calmer place to start: a short list of products with a clear reason to consider each one, and guides that explain the trade-offs in plain language so you can make your own call, including the call not to buy at all.",
  aboutFindTitle: "What you will find here",
  aboutGuidesItem:
    "What matters in a category, the common trade-offs, and the products we would put on a shortlist. Some guides are also available in Korean.",
  aboutFeaturedItem:
    "Featured deals: a handful of products we think are worth a look right now.",
  aboutTopViewsItem:
    "Top views: the product pages visitors opened most over the last 7 days.",
  aboutCategoryItem:
    "Category pages: products and guides grouped by area, such as Home & Kitchen, Electronics, and Outdoor & Sports.",
  aboutProductItem:
    "Product pages: the current price and rating snapshot, a short note on who the product suits, and a link to see it on Amazon.com.",
  aboutHowTitle: "How we work",
  aboutHowPick:
    "Every product starts as a draft and appears on the site only after one of us decides to publish it. We look at the price, the rating and how many reviews stand behind it, and whether the product has a clear everyday use. A high score from a handful of reviews, or a big markdown from an inflated list price, is not enough on its own.",
  aboutHowAi:
    "We use AI writing tools to help with first drafts of some guides and short product notes. We decide what goes live, and we fix or remove anything that turns out to be wrong or out of date. We have not personally tested most of the products we list; when a recommendation comes from our own use, we will say so.",
  aboutHowPrices:
    "Prices and ratings on {site} are snapshots, and each one shows when it was last updated. Amazon changes prices often, so the price you see at checkout on Amazon.com is the one that counts.",
  aboutAffiliateTitle: "How we make money",
  aboutAffiliate:
    "{site} is a participant in the Amazon Services LLC Associates Program. When you buy through our links, Amazon pays us a small referral fee out of its own revenue. You are never charged for this: your price, shipping, and returns are exactly the same as when you shop on Amazon.com directly. Referral fees do not decide which products we list or how we describe them.",
  aboutFeedbackTitle: "Tell us when we get something wrong",
  aboutFeedback:
    "Spotted an outdated price, a broken link, or a product that let you down? Let us know through the contact page. Corrections like these make the site better for the next reader.",

  contactTitle: "Contact",
  contactLead: "Get in touch with the DealStoker team.",
  contactBody:
    "Questions about a listing, partnership ideas, or privacy requests? Email hello@{domain}. For privacy-specific requests, use privacy@{domain}.",

  disclosureTitle: "Affiliate Disclosure",
  disclosureLead: "How DealStoker is funded, and why it never costs you more.",
  disclosureBody:
    "DealStoker is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. Prices and availability are accurate as of the time of writing and may change.",
  disclosureNoCostTitle: "You are never charged for this",
  disclosureNoCostBody:
    "When you click a product link on DealStoker and buy on Amazon.com, Amazon pays DealStoker a referral fee out of its own revenue. Nothing is added to your order: you pay exactly the same price, shipping, and tax as you would by going to Amazon.com directly, and your returns and warranty are handled by Amazon as usual. There is no surcharge, markup, or hidden fee of any kind.",
  disclosureIndependenceBody:
    "Referral fees do not influence which products we list or how we describe them. We choose deals based on price, ratings, and review volume, and we say so when a product has caveats.",

  privacyTitle: "Privacy Policy",
  privacyLead: "Last updated {date}",

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

  magazineHeadline: "Amazon buying guides & deals",
  magazineSupport:
    "Practical buying guides from our curation team, with the Amazon.com picks each one recommends.",
  storiesMeta: "Editor's picks · with the products each guide recommends",
  editorsPick: "Editor's pick",
  guidePicks: "Picks from this guide",
  byCategory: "By category",
  categorySectionMeta: "Guides and picks in {name}",
  moreGuides: "More buying guides",
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
    "DealStoker는 Amazon Associates 회원으로, 링크를 통한 적격 구매가 발생하면 Amazon으로부터 소개 수수료를 받습니다.",
  affiliateNoCost:
    "구매자에게 추가 비용은 전혀 없습니다. 수수료는 Amazon이 지급하며, 결제 금액은 Amazon에서 직접 구매할 때와 동일합니다.",
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
  priceAsOf: "가격 확인",
  priceMayHaveChanged: "이후 변동 가능",
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
  atAGlance: "한눈에 보기",
  newsletterTitle: "주간 추천 받아보기",
  newsletterLead: "새 구매 가이드와 이번 주 할인 폭이 큰 상품을 주 1회 보내 드립니다. 스팸은 없으며 언제든 구독을 해지할 수 있습니다.",
  newsletterPlaceholder: "이메일 주소",
  newsletterSubmit: "구독하기",
  newsletterSending: "보내는 중…",
  newsletterCheckInbox: "거의 다 됐습니다. 받은편지함에서 확인 링크를 눌러 주세요.",
  newsletterError: "문제가 발생했습니다. 다시 시도해 주세요.",
  newsletterPrivacyNote: "이메일은 뉴스레터 발송에만 사용합니다.",
  newsletterConfirmTitle: "구독이 완료되었습니다",
  newsletterConfirmBody: "다음 주간 뉴스레터부터 받아보실 수 있습니다. 모든 메일에 원클릭 구독 해지 링크가 있습니다.",
  newsletterConfirming: "구독을 확인하는 중입니다…",
  newsletterInvalidLink: "유효하지 않거나 이미 사용된 링크입니다.",
  newsletterUnsubTitle: "구독 해지",
  newsletterUnsubBody: "DealStoker 주간 뉴스레터를 더 이상 받지 않으시겠습니까?",
  newsletterUnsubButton: "구독 해지하기",
  newsletterUnsubDone: "구독이 해지되었습니다. 더 이상 뉴스레터를 보내지 않습니다.",
  glanceDeals: "딜",
  glancePriceRange: "가격대",
  glanceBiggestDiscount: "최고 할인",
  biggestDiscount: "할인율순",
  glanceGuides: "구매 가이드",
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
  aboutLead:
    "미국 쇼핑객이 Amazon.com에서 무엇을 살지 결정하도록 돕는 작은 독립 사이트입니다.",
  aboutIntro:
    "{site}({domain})는 2026년에 문을 열었습니다. Amazon.com에서 한 번 더 살펴볼 만한 상품을 고르고, 사기 전에 확인할 점을 정리한 구매 가이드를 쓰며, 모든 가격은 마지막으로 확인한 시각과 함께 보여 드립니다. {site}는 Amazon의 일부가 아니고 직접 상품을 판매하지도 않습니다. 구매를 결정하시면 결제, 배송, 반품은 모두 Amazon.com에서 이루어집니다.",
  aboutWhyTitle: "왜 시작했나요",
  aboutWhy:
    "아마존에서 쇼핑하다 보면 광고 상품, 거의 똑같은 상품 목록, 아무도 그 가격에 사지 않는 정가를 기준으로 한 '할인'을 한참 지나쳐야 합니다. 저희는 좀 더 차분한 출발점을 만들고 싶었습니다. 고려할 이유가 분명한 상품만 짧게 추리고, 장단점을 쉬운 말로 설명하는 가이드를 함께 두어 직접 판단하실 수 있도록요. 사지 않기로 하는 것도 좋은 판단입니다.",
  aboutFindTitle: "여기서 볼 수 있는 것",
  aboutGuidesItem:
    "카테고리별로 중요한 기준, 흔히 고민하는 선택지 간의 차이, 그리고 저희가 후보로 꼽는 상품. 일부 가이드는 한국어로도 제공됩니다.",
  aboutFeaturedItem: "추천 딜: 지금 살펴볼 만하다고 생각하는 몇 가지 상품.",
  aboutTopViewsItem: "인기 조회: 최근 7일 동안 방문자가 가장 많이 연 상품 페이지.",
  aboutCategoryItem:
    "카테고리 페이지: 홈&키친, 전자제품, 아웃도어&스포츠 등 분야별로 모은 상품과 가이드.",
  aboutProductItem:
    "상품 페이지: 현재 가격과 평점, 어떤 분께 맞는 상품인지에 대한 짧은 메모, Amazon.com에서 확인하는 링크.",
  aboutHowTitle: "이렇게 일합니다",
  aboutHowPick:
    "모든 상품은 초안으로 시작하며, 저희가 직접 공개하기로 한 상품만 사이트에 나타납니다. 가격, 평점과 그 평점을 뒷받침하는 리뷰 수, 일상에서 쓰임새가 분명한지를 봅니다. 리뷰 몇 개뿐인 높은 평점이나 부풀려진 정가 대비 큰 할인율만으로는 고르지 않습니다.",
  aboutHowAi:
    "일부 가이드와 짧은 상품 메모의 초안을 쓸 때 AI 글쓰기 도구의 도움을 받습니다. 무엇을 공개할지는 저희가 정하며, 틀렸거나 오래된 내용은 바로잡거나 내립니다. 소개하는 상품 대부분은 저희가 직접 써 본 것이 아닙니다. 직접 사용해 본 경험에 기반한 추천이라면 그렇다고 밝히겠습니다.",
  aboutHowPrices:
    "{site}의 가격과 평점은 특정 시점의 정보이며, 각각 마지막 업데이트 시각을 함께 표시합니다. Amazon의 가격은 자주 바뀌므로 Amazon.com 결제 화면의 가격이 최종 가격입니다.",
  aboutAffiliateTitle: "수익 구조",
  aboutAffiliate:
    "{site}는 Amazon Services LLC Associates Program 참여자입니다. 링크를 통해 구매하시면 Amazon이 자사 수익에서 소액의 소개 수수료를 {site}에 지급합니다. 구매자가 부담하는 금액은 없으며, 가격·배송·반품 조건은 Amazon.com에서 직접 구매할 때와 완전히 동일합니다. 소개 수수료는 어떤 상품을 소개하고 어떻게 설명할지를 정하지 않습니다.",
  aboutFeedbackTitle: "잘못된 점을 알려 주세요",
  aboutFeedback:
    "오래된 가격, 깨진 링크, 기대에 못 미친 상품을 발견하셨나요? 문의 페이지로 알려 주세요. 이런 제보가 다음 방문자에게 더 나은 사이트를 만듭니다.",

  contactTitle: "문의",
  contactLead: "DealStoker 팀에 연락하세요.",
  contactBody:
    "상품, 파트너십, 개인정보 관련 문의는 hello@{domain}으로 보내 주세요. 개인정보 요청은 privacy@{domain}을 이용해 주세요.",

  disclosureTitle: "제휴 고지",
  disclosureLead: "DealStoker의 수익 구조와 구매자에게 추가 비용이 없는 이유.",
  disclosureBody:
    "DealStoker는 Amazon.com에 광고하고 링크하는 사이트가 Amazon으로부터 광고 수수료를 받을 수 있도록 마련된 Amazon Services LLC Associates Program 참여자입니다. 가격과 재고 정보는 작성 시점 기준이며 변경될 수 있습니다.",
  disclosureNoCostTitle: "구매자에게 청구되는 비용은 없습니다",
  disclosureNoCostBody:
    "DealStoker의 상품 링크를 눌러 Amazon.com에서 구매하면, Amazon이 자사 수익에서 DealStoker에 소개 수수료를 지급합니다. 주문 금액에 더해지는 것은 없습니다. 상품 가격, 배송비, 세금은 Amazon.com에 직접 접속해 구매할 때와 정확히 같고, 반품과 보증도 평소처럼 Amazon이 처리합니다. 추가 요금, 가격 인상, 숨은 비용은 어떤 형태로도 없습니다.",
  disclosureIndependenceBody:
    "소개 수수료는 어떤 상품을 소개하고 어떻게 설명하는지에 영향을 주지 않습니다. 딜은 가격, 평점, 리뷰 수를 기준으로 선정하며, 단점이 있는 상품은 그 점을 함께 적습니다.",

  privacyTitle: "개인정보 처리방침",
  privacyLead: "최종 업데이트: {date}",

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

  magazineHeadline: "아마존 구매 가이드 & 딜",
  magazineSupport:
    "큐레이션 팀이 직접 쓴 구매 가이드와, 가이드마다 추천하는 Amazon.com 상품을 함께 보여드립니다.",
  storiesMeta: "에디터 추천 · 가이드별 추천 상품 포함",
  editorsPick: "에디터 추천",
  guidePicks: "이 가이드의 추천 상품",
  byCategory: "카테고리별",
  categorySectionMeta: "{name} 가이드와 추천 상품",
  moreGuides: "가이드 더 보기",
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
