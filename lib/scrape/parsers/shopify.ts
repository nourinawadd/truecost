import { parsePrice } from "@/lib/scrape/price";
import type { Parser, ProductInfo } from "@/lib/scrape/types";

export function matchesShopify(url: URL): boolean {
  const segments = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
  const handle = segments[segments.length - 1];

  return (
    segments.length >= 2 &&
    segments[segments.length - 2].toLowerCase() === "products" &&
    handle.length > 0 &&
    !handle.toLowerCase().endsWith(".js")
  );
}

export const shopifyParser: Parser = {
  name: "shopify",
  strong: true,

  async parse(ctx) {
    if (!matchesShopify(ctx.url)) return null;

    const jsUrl = new URL(ctx.url);
    jsUrl.pathname = jsUrl.pathname.replace(/\/+$/, "") + ".js";
    jsUrl.hash = "";

    let data: unknown;
    try {
      data = await ctx.fetchJson(jsUrl.toString());
    } catch {
      return null;
    }
    if (typeof data !== "object" || data === null) return null;

    const product = data as Record<string, unknown>;
    const title = text(product.title);
    if (!title) return null;

    const info: ProductInfo = {
      title,
      brand: text(product.vendor),
      image: image(product),
      price: cents(product.price),
    };
    return info;
  },
};

function cents(value: unknown): number | undefined {
  const n = typeof value === "number" ? value : parsePrice(text(value));
  return n !== null && Number.isFinite(n) ? n / 100 : undefined;
}

function image(product: Record<string, unknown>): string | undefined {
  const images = Array.isArray(product.images) ? product.images : [];
  const url = text(product.featured_image) ?? images.map(text).find(Boolean);
  return url?.startsWith("//") ? `https:${url}` : url;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
