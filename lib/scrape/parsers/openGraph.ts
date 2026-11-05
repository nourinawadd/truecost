import type { CheerioAPI } from "cheerio";
import { parseCurrency, parsePrice } from "@/lib/scrape/price";
import type { Parser, ProductInfo } from "@/lib/scrape/types";

// <meta property="og:..."> tags meant for link previews. A weak source: they
// are often stale or generic, so the UI asks the user to check what came from here.
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

    // every page has a <title>, so it alone doesn't count as finding anything
    if (Object.values(tags).every((v) => v === undefined)) return null;
    return { ...tags, title: tags.title ?? clean($("title").first().text()) };
  },
};

// shops use property= (the spec) or name= (common mistake); accept both
function meta($: CheerioAPI, key: string): string | undefined {
  const content =
    $(`meta[property="${key}"]`).attr("content") ?? $(`meta[name="${key}"]`).attr("content");
  return clean(content);
}

function clean(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}
