import { parsePrice } from "@/lib/scrape/price";
import type { Parser, ProductInfo } from "@/lib/scrape/types";

type Node = Record<string, unknown>;

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

function flatten(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(flatten);
  if (typeof value !== "object" || value === null) return [];
  const node = value as Node;
  return [node, ...flatten(node["@graph"])];
}

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

function offer(node: Node): { price?: number; currency?: string } {
  for (const o of flatten(node.offers)) {
    const price = number(o.price) ?? number(o.lowPrice);
    const currency = text(o.priceCurrency);
    if (price !== undefined || currency) return { price, currency };
  }
  return {};
}

function number(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  if (/^\s*\d+(\.\d+)?\s*$/.test(value)) return Number(value);
  return parsePrice(value) ?? undefined;
}

function brand(value: unknown): string | undefined {
  const list = Array.isArray(value) ? value : [value];
  return list.map((b) => text(b) ?? text((b as Node | null)?.name)).find(Boolean);
}

function image(value: unknown): string | undefined {
  const list = Array.isArray(value) ? value : [value];
  return list.map((i) => text(i) ?? text((i as Node | null)?.url)).find(Boolean);
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
