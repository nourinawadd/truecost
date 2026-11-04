// Duty rule per category. Simplified demo data, not an official customs tariff.

export const CATEGORY_IDS = [
  "clothing",
  "cosmetics",
  "phones",
  "electronics",
  "books",
  "other",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export type Category = { id: CategoryId; label: string; keywords: string[] } & (
  | { kind: "band"; low: number; high: number } // duty is a range of cif
  | { kind: "flat"; rate: number } // one rate replaces duty + vat
  | { kind: "pending" } // rate to be added
);

export const CATEGORIES: Category[] = [
  {
    id: "clothing",
    label: "clothing",
    kind: "band",
    low: 0.3,
    high: 0.4,
    keywords: [
      "shirt", "t-shirt", "tee", "hoodie", "jacket", "dress", "jeans", "trousers",
      "pants", "sweater", "coat", "skirt", "shorts", "blouse", "cardigan", "sweatshirt",
      "socks", "leggings",
    ],
  },
  {
    id: "cosmetics",
    label: "cosmetics",
    kind: "band",
    low: 0.3,
    high: 0.6,
    keywords: [
      "lipstick", "mascara", "foundation", "concealer", "serum", "moisturizer",
      "moisturiser", "cleanser", "toner", "sunscreen", "perfume", "fragrance",
      "eyeliner", "blush", "skincare", "makeup", "cream",
    ],
  },
  {
    id: "phones",
    label: "phones",
    kind: "flat",
    rate: 0.385,
    keywords: [
      "phone", "smartphone", "iphone", "galaxy", "pixel", "xiaomi", "redmi", "oneplus",
      "huawei", "oppo", "realme", "mobile", "android",
    ],
  },
  {
    id: "electronics",
    label: "electronics",
    kind: "pending",
    keywords: [
      "laptop", "headphones", "earbuds", "charger", "keyboard", "mouse", "monitor",
      "tablet", "ipad", "camera", "speaker", "smartwatch", "console", "cable",
      "router", "ssd",
    ],
  },
  {
    id: "books",
    label: "books",
    kind: "pending",
    keywords: [
      "book", "novel", "paperback", "hardcover", "hardback", "edition", "author",
      "comic", "manga", "textbook", "notebook", "journal",
    ],
  },
  // the fallback: never wins a keyword match
  { id: "other", label: "other", kind: "pending", keywords: [] },
];

export function getCategory(id: string): Category {
  return (
    CATEGORIES.find((c) => c.id === id) ??
    (CATEGORIES.find((c) => c.id === "other") as Category)
  );
}
