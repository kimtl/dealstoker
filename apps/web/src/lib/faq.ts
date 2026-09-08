import { formatMoney, formatRating, formatReviewCount } from "./format";
import { SITE_NAME } from "./site";
import type { Category, ProductDetail } from "./types";

export type FaqItem = {
  question: string;
  answer: string;
};

const CATEGORY_GUIDES: Record<
  string,
  { guide: string; faqs: FaqItem[] }
> = {
  "home-kitchen": {
    guide:
      "Start with highly rated everyday tools — cookware, small appliances, and organizers — then compare price, review volume, and whether the item fits your kitchen setup before you buy on Amazon.",
    faqs: [
      {
        question: "What should I look for in Home & Kitchen deals?",
        answer:
          "Prioritize clear use cases (cooking, cleanup, storage), strong review volume, and a current price that makes sense versus the list price. Prefer durable materials and dishwasher-safe options when they matter for daily use.",
      },
      {
        question: "Are small appliances worth buying on deal pages?",
        answer:
          "Yes when ratings stay strong and the discounted price is meaningful. Check wattage, capacity, and cleaning notes in the product features before clicking through to Amazon.",
      },
    ],
  },
  electronics: {
    guide:
      "Focus on practical electronics with clear specs — audio, power, and accessories — and weigh battery life, compatibility, and recent review trends before you purchase.",
    faqs: [
      {
        question: "How do I compare Electronics deals on DealStoker?",
        answer:
          "Look at price versus list price, star rating, review count, and whether the features mention compatibility (USB-C, Bluetooth, device models). Then open the Amazon listing to confirm the latest availability.",
      },
      {
        question: "Should I wait for a lower electronics price?",
        answer:
          "If the discount is already steep and reviews are solid, waiting can mean missing stock. If reviews are mixed or the cut is tiny, keep browsing related deals first.",
      },
    ],
  },
  "outdoor-sports": {
    guide:
      "Choose outdoor and sports gear by activity first — hiking, camping, fitness — then confirm size, weather readiness, and packability in the product details.",
    faqs: [
      {
        question: "What matters most for Outdoor & Sports picks?",
        answer:
          "Match the product to a real activity, check durability notes, and confirm sizing or capacity. Strong ratings help, but activity fit matters more than a small extra discount.",
      },
      {
        question: "Can I trust outdoor gear prices shown here?",
        answer: `Prices on ${SITE_NAME} are a snapshot and may change on Amazon.com. Always confirm the live price and return policy on Amazon before buying.`,
      },
    ],
  },
  "beauty-personal-care": {
    guide:
      "Look for skin, hair, and grooming essentials with clear ingredients or tool specs, then compare ratings and refill or replacement needs.",
    faqs: [
      {
        question: "How should I shop Beauty & Personal Care deals?",
        answer:
          "Check the product features for skin type, heat settings, or material claims, then compare ratings and review volume. Prefer items with clear directions and strong everyday usefulness.",
      },
      {
        question: "Do beauty deal pages replace Amazon reviews?",
        answer: `No. ${SITE_NAME} highlights curated deals and key context, but you should still skim recent Amazon reviews for sensitivity, scent, and longevity feedback.`,
      },
    ],
  },
  "health-household": {
    guide:
      "Stock household and health staples by need first — cleaning, wellness, pantry — then compare pack size, refill cost, and ratings.",
    faqs: [
      {
        question: "What makes a good Health & Household deal?",
        answer:
          "Useful pack size, clear usage notes, and consistent ratings. Multi-packs can look cheaper per unit, so compare quantity before you buy.",
      },
      {
        question: "Are health products medical advice?",
        answer: `${SITE_NAME} is a deal curation site, not a medical service. For supplements or health devices, read Amazon labels and talk with a professional when needed.`,
      },
    ],
  },
  baby: {
    guide:
      "For baby essentials, prioritize safety notes, age suitability, and cleaning convenience before chasing the deepest discount.",
    faqs: [
      {
        question: "What should parents check on Baby deals?",
        answer:
          "Confirm age range, materials, cleaning instructions, and recent ratings. Safety and fit matter more than a small price difference.",
      },
      {
        question: "Do you sell baby products directly?",
        answer: `No. ${SITE_NAME} links to Amazon.com product pages. Purchases, shipping, and returns are handled by Amazon.`,
      },
    ],
  },
  pets: {
    guide:
      "Shop pet deals by animal and use case — feeding, grooming, travel, play — and confirm size, material, and rating signals before checkout.",
    faqs: [
      {
        question: "How do I pick Pet deals quickly?",
        answer:
          "Filter by your pet’s needs, check sizing or capacity in the features, and prefer products with strong review volume. Then verify the live Amazon price.",
      },
      {
        question: "Are pet food and treat deals safe?",
        answer:
          "Always read ingredients and feeding guidance on the Amazon listing. Deal pages summarize products; they are not a substitute for veterinary advice.",
      },
    ],
  },
  "office-school": {
    guide:
      "Build a useful desk or school setup with durable stationery, organizers, and WFH accessories — then compare price and ratings for daily-use items.",
    faqs: [
      {
        question: "What Office & School items are best for deals?",
        answer:
          "Everyday tools you refill or replace often — notebooks, desk organizers, backpacks, and charging accessories — especially when ratings stay high at a lower price.",
      },
      {
        question: "Can students and remote workers use the same deals?",
        answer:
          "Often yes. Look for portable, durable options with clear capacity or compatibility notes that fit both classroom and home-office setups.",
      },
    ],
  },
  "tools-home-improvement": {
    guide:
      "Pick tools and home-improvement gear by the job — measure, fasten, organize, upgrade — and confirm power source, size, and durability details.",
    faqs: [
      {
        question: "How do I choose Tools & Home Improvement deals?",
        answer:
          "Define the job first, then check specs, included accessories, and ratings. A slightly higher-priced tool with better reviews can be the better buy.",
      },
      {
        question: "Should beginners buy DIY tool deals?",
        answer:
          "Yes for starter kits and organizers with clear instructions and strong ratings. Read safety notes on Amazon before use.",
      },
    ],
  },
  "fashion-accessories": {
    guide:
      "Choose bags, watches, and accessories by fit and daily use, then compare materials, sizing, and recent reviews.",
    faqs: [
      {
        question: "What matters in Fashion & Accessories deals?",
        answer:
          "Fit, material, and how often you’ll wear or carry the item. Check sizing notes and photo context, then confirm the live Amazon price.",
      },
      {
        question: "Are accessory colors and sizes guaranteed?",
        answer:
          "Deal pages show the curated listing snapshot. Always verify color, size, and seller details on Amazon before purchasing.",
      },
    ],
  },
};

function genericCategoryFaqs(categoryName: string): FaqItem[] {
  return [
    {
      question: `How does ${SITE_NAME} pick ${categoryName} deals?`,
      answer: `Editors review usefulness, ratings, review volume, and price positioning before publishing ${categoryName.toLowerCase()} deals. We favor clear everyday use cases over hype.`,
    },
    {
      question: "Do prices on DealStoker match Amazon checkout?",
      answer: `Not always. Prices shown on ${SITE_NAME} can change. The Amazon product page is the source of truth for live price, shipping, and availability.`,
    },
    {
      question: "Does DealStoker earn money from these links?",
      answer: `Yes. As an Amazon Associate, ${SITE_NAME} may earn a commission when you buy through our links, at no extra cost to you.`,
    },
  ];
}

export function getCategoryGuide(slug: string): string | null {
  return CATEGORY_GUIDES[slug]?.guide ?? null;
}

export function getCategoryFaqs(category: Pick<Category, "name" | "slug">): FaqItem[] {
  const specific = CATEGORY_GUIDES[category.slug]?.faqs ?? [];
  const generic = genericCategoryFaqs(category.name);
  const merged = [...specific];
  for (const item of generic) {
    if (!merged.some((faq) => faq.question === item.question)) {
      merged.push(item);
    }
  }
  return merged.slice(0, 6);
}

export function getAboutFaqs(): FaqItem[] {
  return [
    {
      question: `What is ${SITE_NAME}?`,
      answer: `${SITE_NAME} is an Amazon deal curation site for US online shoppers. We highlight practical Amazon.com products with clear prices and useful context so you can compare options faster.`,
    },
    {
      question: "How do you choose which deals to publish?",
      answer:
        "Editors review ratings, review volume, usefulness, and price positioning. We favor clear use cases over hype, and we can update or unpublish listings when quality or availability signals change.",
    },
    {
      question: "Is DealStoker an Amazon Associate?",
      answer: `Yes. ${SITE_NAME} participates in the Amazon Services LLC Associates Program and may earn a commission from qualifying purchases at no extra cost to you.`,
    },
    {
      question: "Why might the price differ on Amazon?",
      answer: `Prices and availability on ${SITE_NAME} are snapshots. Amazon.com can change price, stock, or shipping details by the time you check out.`,
    },
    {
      question: "Where can I get help with a listing?",
      answer: `Use the contact page for site or listing questions. For order issues after purchase, contact Amazon directly because checkout happens on Amazon.com.`,
    },
  ];
}

export function getProductFaqs(product: ProductDetail): FaqItem[] {
  const price = formatMoney(product.priceAmount, product.currency);
  const listPrice = formatMoney(product.listPrice, product.currency);
  const rating = formatRating(product.rating);
  const reviews = formatReviewCount(product.reviewCount);
  const category = product.categoryName || "this category";
  const faqs: FaqItem[] = [
    {
      question: `What is the ${product.title} deal on ${SITE_NAME}?`,
      answer: [
        `${SITE_NAME} lists this curated Amazon.com deal in ${category}.`,
        price ? `The currently shown price is ${price}.` : null,
        listPrice && listPrice !== price
          ? `The listed comparison price is ${listPrice}.`
          : null,
        rating
          ? `Shopper rating signals show ${rating} stars${reviews ? ` from about ${reviews} reviews` : ""}.`
          : null,
        "Always confirm the live price and availability on Amazon before buying.",
      ]
        .filter(Boolean)
        .join(" "),
    },
    {
      question: "Where do I buy this product?",
      answer: `Use the View on Amazon button on this page. ${SITE_NAME} does not sell inventory directly — checkout, shipping, and returns are handled on Amazon.com.`,
    },
    {
      question: "Does clicking the Amazon link cost more?",
      answer: `No. Buying through ${SITE_NAME} affiliate links does not increase the Amazon price. We may earn a commission if you purchase.`,
    },
  ];

  if (product.features?.length) {
    const highlights = product.features
      .slice(0, 3)
      .map((feature) => feature.trim())
      .filter(Boolean);
    if (highlights.length) {
      faqs.push({
        question: "What are the key features to know before buying?",
        answer: `Key points highlighted on this deal page: ${highlights.join(" ")} Review the full Amazon listing for the latest specs and seller details.`,
      });
    }
  }

  if (product.brand) {
    faqs.push({
      question: `Who makes this product?`,
      answer: `This listing is from ${product.brand}. Brand, model details, and warranty terms should be confirmed on the Amazon product page.`,
    });
  }

  return faqs.slice(0, 5);
}

/** Prefer a concise editorial meta description over raw Amazon paste. */
export function buildIntentProductMetaDescription(product: ProductDetail): string {
  if (product.seoDescription?.trim()) {
    return product.seoDescription.trim();
  }
  const price = formatMoney(product.priceAmount, product.currency);
  const rating = formatRating(product.rating);
  const category = product.categoryName || "Amazon";
  const brand = product.brand ? `${product.brand} ` : "";
  const bits = [
    `See the ${brand}${product.title} deal on ${SITE_NAME}.`,
    price ? `Shown at ${price}` : null,
    rating ? `with ${rating}-star shopper ratings` : null,
    `in ${category}.`,
    "Compare price and features, then view it on Amazon.com.",
  ].filter(Boolean);
  return bits.join(" ");
}
