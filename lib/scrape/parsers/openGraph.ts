import type { CheerioAPI } from "cheerio";
import { parseCurrency, parsePrice } from "@/lib/scrape/price";
import type { Parser, ProductInfo } from "@/lib/scrape/types";

export const openGraphParser: Parser = {
  name: "open-graph",
  strong: false,

  async parse(ctx) {
    const $ = ctx.$;
    if (!$) return null;

    const amount = meta($, "product:price:amount") ?? meta($, "og:price:amount");
    const tags: ProductInfo = {
      title: meta($, "og:title"),
      brand: meta($, "og:site_name"),
      image: meta($, "og:image"),
      price: parsePrice(amount) ?? undefined,
      currency:
        meta($, "product:price:currency") ??
        meta($, "og:price:currency") ??
        parseCurrency(amount) ??
        undefined,
    };

    if (Object.values(tags).every((v) => v === undefined)) return null;
    return { ...tags, title: tags.title ?? clean($("title").first().text()) };
  },
};

function meta($: CheerioAPI, key: string): string | undefined {
  const content =
    $(`meta[property="${key}"]`).attr("content") ?? $(`meta[name="${key}"]`).attr("content");
  return clean(content);
}

function clean(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}
