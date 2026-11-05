import { parsePrice } from "@/lib/scrape/price";
import type { Parser, ProductInfo } from "@/lib/scrape/types";

type Node = Record<string, unknown>;

// schema.org Product data that shops put in <script type="application/ld+json">
export const jsonLdParser: Parser = {
  name: "json-ld",
  strong: true,

  async parse(ctx) {
    const $ = ctx.$;
    if (!$) return null;

    for (const script of $('script[type="application/ld+json"]').toArray()) {
      const json = parseJson($(script).text());
      for (const node of flatten(json)) {
        if (isProduct(node)) {
          const info = read(node);
          if (info) return info;
        }
      }
    }
    return null;
  },
};

// One broken script must not stop the others, so bad JSON → null.
// Some themes put raw newlines inside strings, which JSON forbids: second try
// with control characters turned into spaces.
function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse([...raw].map((c) => (c < " " ? " " : c)).join(""));
    } catch {
      return null;
    }
  }
}

// every object in the tree we care about: arrays, @graph lists, and the node itself
function flatten(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(flatten);
  if (typeof value !== "object" || value === null) return [];
  const node = value as Node;
  return [node, ...flatten(node["@graph"])];
}

// "Product", "ProductGroup", "https://schema.org/Product", or an array of types
function isProduct(node: Node): boolean {
  const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
  return types.some((t) => {
    if (typeof t !== "string") return false;
    const bare = t.slice(t.lastIndexOf("/") + 1).toLowerCase();
    return bare === "product" || bare === "productgroup";
  });
}

function read(node: Node): ProductInfo | null {
  const title = text(node.name);
  if (!title) return null;

  let { price, currency } = offer(node);
  let img = image(node.image);

  // a ProductGroup often keeps price and image on its variants
  for (const variant of flatten(node.hasVariant)) {
    if (price !== undefined && img) break;
    if (price === undefined) {
      const v = offer(variant);
      price = v.price;
      currency ??= v.currency;
    }
    img ??= image(variant.image);
  }

  return { title, brand: brand(node.brand), image: img, price, currency };
}

// offers can be one object or a list; the first with a price or currency wins
function offer(node: Node): { price?: number; currency?: string } {
  for (const o of flatten(node.offers)) {
    const price = number(o.price) ?? number(o.lowPrice);
    const currency = text(o.priceCurrency);
    if (price !== undefined || currency) return { price, currency };
  }
  return {};
}

// schema.org says machine numbers ("79.00"), but shops also write "1.299,00 €"
function number(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  if (/^\s*\d+(\.\d+)?\s*$/.test(value)) return Number(value);
  return parsePrice(value) ?? undefined;
}

// a string, { name }, or a list of either
function brand(value: unknown): string | undefined {
  const list = Array.isArray(value) ? value : [value];
  return list.map((b) => text(b) ?? text((b as Node | null)?.name)).find(Boolean);
}

// a string, { url }, or a list of either
function image(value: unknown): string | undefined {
  const list = Array.isArray(value) ? value : [value];
  return list.map((i) => text(i) ?? text((i as Node | null)?.url)).find(Boolean);
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
