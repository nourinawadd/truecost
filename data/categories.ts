export const CATEGORY_IDS = [
  "clothing",
  "cosmetics",
  "phones",
  "electronics",
  "books",
  "other",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export type Category = {
  id: CategoryId;
  label: string;
  keywords: string[];
  exclude: string[];
} & (
  | { kind: "band"; low: number; high: number }
  | { kind: "flat"; rate: number }
  | { kind: "pending" }
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
    exclude: [],
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
    exclude: [],
  },
  {
    id: "phones",
    label: "phones",
    kind: "flat",
    rate: 0.385,
    keywords: [
      "smartphone", "iphone", "xiaomi", "redmi", "oneplus", "huawei", "oppo", "realme",
      "mobile", "android",
    ],
    exclude: ["case", "cover", "buds", "earbuds", "charger", "cable"],
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
    exclude: [],
  },
  {
    id: "books",
    label: "books",
    kind: "pending",
    keywords: [
      "book", "novel", "paperback", "hardcover", "hardback", "author", "comic", "manga",
      "textbook", "journal",
    ],
    exclude: [],
  },
  { id: "other", label: "other", kind: "pending", keywords: [], exclude: [] },
];

export function getCategory(id: string): Category {
  return (
    CATEGORIES.find((c) => c.id === id) ??
    (CATEGORIES.find((c) => c.id === "other") as Category)
  );
}
