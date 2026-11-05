import type { CheerioAPI } from "cheerio";

// What a parser can read off a product page. Every field is optional:
// most shops only give some of them.
export type ProductInfo = {
  title?: string;
  brand?: string;
  image?: string;
  price?: number; // in the shop's currency
  currency?: string; // ISO code like "USD"; may be one we have no rate for
};

export type Field = keyof ProductInfo;

export type ParserName = "shopify" | "json-ld" | "open-graph";

// provenance: which parser each field came from
export type Sources = Partial<Record<Field, ParserName>>;

// HOLD's IProductParser. "strong" sources are product data the shop publishes
// on purpose (Shopify, JSON-LD); weak ones are page tags meant for previews.
export type Parser = {
  name: ParserName;
  strong: boolean;
  parse(ctx: ScrapeContext): Promise<ProductInfo | null>;
};

export type ScrapeContext = {
  url: URL;
  html: string | null; // null when the shop blocked the page itself
  $: CheerioAPI | null; // the parsed html, loaded once for all parsers
  fetchJson(url: string): Promise<unknown>; // the only network door, injected
};

// one line of the progress log; ok: false is drawn as a red [×]
export type Step = { text: string; ms: number; ok: boolean };
