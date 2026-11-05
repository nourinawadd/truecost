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
      const value = usable(found[field]);
      if (value === undefined) continue;

      Object.assign(info, { [field]: value });
      sources[field] = parser.name;
      if (parser.strong) strong = true;
    }
  }

  if (info.currency) info.currency = info.currency.toUpperCase();

  // pages often give "/img/shirt.jpg": resolve it against the page.
  // Anything that isn't http(s) is dropped, so we never render odd schemes.
  if (info.image) {
    const absolute = absoluteHttpUrl(info.image, pageUrl);
    if (absolute) info.image = absolute;
    else {
      delete info.image;
      delete sources.image;
    }
  }

  return {
    info,
    sources,
    strong,
    isComplete: Boolean(info.title && info.price !== undefined && info.currency && info.image),
  };
}

// blank strings and zero or broken prices don't count as found
function usable(value: string | number | undefined): string | number | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : undefined;
  return undefined;
}

function absoluteHttpUrl(raw: string, base: URL): string | null {
  try {
    const url = new URL(raw, base);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
