import type { CheerioAPI } from "cheerio";

export type ProductInfo = {
  title?: string;
  brand?: string;
  image?: string;
  price?: number;
  currency?: string;
};

export type Field = keyof ProductInfo;

type ParserName = "shopify" | "json-ld" | "open-graph";

export type Sources = Partial<Record<Field, ParserName>>;

export type Parser = {
  name: ParserName;
  strong: boolean;
  parse(ctx: ScrapeContext): Promise<ProductInfo | null>;
};

export type ScrapeContext = {
  url: URL;
  html: string | null;
  $: CheerioAPI | null;
  fetchJson(url: string): Promise<unknown>;
};

export type Step = { text: string; ms: number; ok: boolean };
