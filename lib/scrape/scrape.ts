import { load } from "cheerio";
import { mergeProduct, type ParserResult } from "@/lib/scrape/merge";
import { jsonLdParser } from "@/lib/scrape/parsers/jsonLd";
import { openGraphParser } from "@/lib/scrape/parsers/openGraph";
import { matchesShopify, shopifyParser } from "@/lib/scrape/parsers/shopify";
import type { ProductInfo, ScrapeContext, Sources, Step } from "@/lib/scrape/types";

type ScrapeResult = {
  info: ProductInfo;
  sources: Sources;
  strong: boolean;
  steps: Step[];
};

export async function scrapeProduct(
  url: URL,
  html: string | null,
  fetchJson: ScrapeContext["fetchJson"],
  startedAt = Date.now(),
): Promise<ScrapeResult> {
  const steps: Step[] = [];
  const step = (text: string, ok = true) => steps.push({ text, ms: Date.now() - startedAt, ok });

  const ctx: ScrapeContext = { url, html, $: html ? load(html) : null, fetchJson };
  const results: ParserResult[] = [];
  const complete = () => mergeProduct(results, url).isComplete;

  if (matchesShopify(url)) {
    const info = await shopifyParser.parse(ctx);
    if (info) {
      results.push({ parser: shopifyParser, info });
      step("shopify storefront detected");
      step("product data read");
    }
  }

  if (ctx.$ && !complete()) {
    step("reading price");
    for (const parser of [jsonLdParser, openGraphParser]) {
      if (complete()) break;
      const info = await parser.parse(ctx);
      if (!info) continue;
      results.push({ parser, info });
      if (parser === openGraphParser) step("details found in page tags");
      else step(info.price !== undefined ? "price found in product data" : "product data found");
    }
  }

  const merged = mergeProduct(results, url);
  if (merged.info.price === undefined) step("no price on this page", false);

  return { info: merged.info, sources: merged.sources, strong: merged.strong, steps };
}
