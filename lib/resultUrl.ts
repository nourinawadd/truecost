import { CATEGORY_IDS, type CategoryId } from "@/data/categories";
import {
  DEFAULT_FEES_EGP,
  DEFAULT_SHIPPING_BAND,
  FX_RATES,
  SHIPPING_BANDS,
  type Currency,
} from "@/data/config";
import type { Sources } from "@/lib/scrape/types";

type Mark = "read" | "guess";
export type MarkedField = "price" | "cur" | "title" | "img" | "cat";
export type Src = Partial<Record<MarkedField, Mark>>;

export type ResultParams = {
  price: number;
  cur: string | null;
  cat: CategoryId;
  ship: number;
  fx: number | null;
  fees: number;
  local: number | null;
  title?: string;
  img?: string;
  shop?: string;
  src: Src;
};

const MARKED_FIELDS: readonly string[] = ["price", "cur", "title", "img", "cat"];

export const DEFAULT_SHIP_USD =
  SHIPPING_BANDS.find((band) => band.id === DEFAULT_SHIPPING_BAND)?.usd ?? 0;

export function rateFor(cur: string | null | undefined): number | null {
  return cur && Object.hasOwn(FX_RATES, cur) ? FX_RATES[cur as Currency] : null;
}

export function buildResultUrl(p: Partial<ResultParams>): string {
  const query = new URLSearchParams();
  const put = (key: string, value: string | number | null | undefined) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  };

  put("price", p.price);
  put("cur", p.cur);
  put("cat", p.cat);
  put("ship", p.ship);
  put("fx", p.fx);
  put("fees", p.fees);
  put("local", p.local);
  put("title", p.title);
  put("img", p.img);
  put("shop", p.shop);
  if (p.src) {
    put(
      "src",
      Object.entries(p.src)
        .map(([field, mark]) => `${field}:${mark}`)
        .join(","),
    );
  }

  return `/result?${query}`;
}

export function parseResultParams(
  record: Record<string, string | string[] | undefined>,
): ResultParams {
  const get = (key: string) => {
    const value = record[key];
    return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
  };

  const rawCur = get("cur");
  const cur = rawCur && /^[a-z]{3}$/i.test(rawCur) ? rawCur.toUpperCase() : null;
  const rawCat = get("cat");
  const cat = CATEGORY_IDS.find((id) => id === rawCat) ?? "other";

  return {
    price: number(get("price"), true) ?? 0,
    cur,
    cat,
    ship: number(get("ship"), true) ?? DEFAULT_SHIP_USD,
    fx: number(get("fx"), false) ?? rateFor(cur),
    fees: number(get("fees"), true) ?? DEFAULT_FEES_EGP,
    local: number(get("local"), false) ?? null,
    title: get("title")?.slice(0, 200),
    img: httpUrl(get("img")),
    shop: get("shop")?.slice(0, 253),
    src: parseSrc(get("src")),
  };
}

export function sourcesToSrc(sources: Sources, categoryGuessed: boolean): Src {
  const src: Src = {};
  const fields = [
    ["price", sources.price],
    ["cur", sources.currency],
    ["title", sources.title],
    ["img", sources.image],
  ] as const;

  for (const [field, parser] of fields) {
    if (parser) src[field] = parser === "open-graph" ? "guess" : "read";
  }
  if (categoryGuessed) src.cat = "guess";
  return src;
}

function number(raw: string | undefined, allowZero: boolean): number | undefined {
  if (raw === undefined) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && (allowZero ? n >= 0 : n > 0) ? n : undefined;
}

function httpUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function parseSrc(raw: string | undefined): Src {
  const src: Src = {};
  for (const pair of raw?.split(",") ?? []) {
    const [field, mark] = pair.split(":");
    if (MARKED_FIELDS.includes(field) && (mark === "read" || mark === "guess")) {
      src[field as MarkedField] = mark;
    }
  }
  return src;
}
