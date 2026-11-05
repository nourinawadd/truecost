import type { Field, Parser, ProductInfo, Sources } from "@/lib/scrape/types";

export type ParserResult = { parser: Parser; info: ProductInfo };

export type Merged = {
  info: ProductInfo;
  sources: Sources;
  strong: boolean; // at least one field came from a strong parser
  isComplete: boolean; // nothing left for a later parser to add
};

const FIELDS: Field[] = ["title", "brand", "image", "price", "currency"];

// Port of HOLD's Merge class. Results come in ladder order, so for each field
// the first usable value wins and we remember which parser gave it.
export function mergeProduct(results: ParserResult[], pageUrl: URL): Merged {
  const info: ProductInfo = {};
  const sources: Sources = {};
  let strong = false;

  for (const { parser, info: found } of results) {
    for (const field of FIELDS) {
      if (info[field] !== undefined) continue;
      const value = usable(field, found[field], pageUrl);
      if (value === undefined) continue;

      Object.assign(info, { [field]: value });
      sources[field] = parser.name;
      if (parser.strong) strong = true;
    }
  }

  return {
    info,
    sources,
    strong,
    isComplete: Boolean(info.title && info.price !== undefined && info.currency && info.image),
  };
}

// The cleaned-up value, or undefined when it doesn't count as found, so a
// later parser gets its turn: blank strings, zero or broken prices, and
// images that aren't http(s).
function usable(field: Field, value: string | number | undefined, pageUrl: URL) {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : undefined;
  if (typeof value !== "string" || !value.trim()) return undefined;

  const text = value.trim();
  if (field === "currency") return text.toUpperCase();
  // pages often give "/img/shirt.jpg": resolve it against the page.
  // Anything that isn't http(s) is dropped, so we never render odd schemes.
  if (field === "image") return absoluteHttpUrl(text, pageUrl) ?? undefined;
  return text;
}

function absoluteHttpUrl(raw: string, base: URL): string | null {
  try {
    const url = new URL(raw, base);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
