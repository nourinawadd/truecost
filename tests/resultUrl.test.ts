import { describe, expect, it } from "vitest";
import { FX_RATES } from "@/data/config";
import {
  DEFAULT_SHIP_USD,
  buildResultUrl,
  parseResultParams,
  sourcesToSrc,
  type ResultParams,
} from "@/lib/resultUrl";

function paramsOf(url: string): Record<string, string> {
  return Object.fromEntries(new URL(url, "https://truecost.test").searchParams);
}

describe("result url", () => {
  it("survives a round trip: build, then parse, gives the same params", () => {
    const params: ResultParams = {
      price: 79.5,
      cur: "USD",
      cat: "clothing",
      ship: 12,
      fx: 50,
      fees: 150,
      local: 9000,
      title: "Linen Overshirt & Co",
      img: "https://cdn.example.com/a.jpg",
      shop: "shop.example.com",
      src: { price: "read", cur: "read", cat: "guess" },
    };
    const url = buildResultUrl(params);

    expect(url.startsWith("/result?price=79.5&cur=USD&cat=clothing")).toBe(true);
    expect(url).toContain("src=price%3Aread%2Ccur%3Aread%2Ccat%3Aguess");
    expect(parseResultParams(paramsOf(url))).toEqual(params);
  });

  it("skips empty values when building", () => {
    expect(buildResultUrl({ price: 10, cur: null, title: "" })).toBe("/result?price=10");
  });

  it("an empty url gets every default", () => {
    expect(parseResultParams({})).toEqual({
      price: 0,
      cur: null,
      cat: "other",
      ship: DEFAULT_SHIP_USD,
      fx: null,
      fees: 0,
      local: null,
      title: undefined,
      img: undefined,
      shop: undefined,
      src: {},
    });
  });

  it("bad numbers fall back to the defaults", () => {
    const p = parseResultParams({ price: "abc", ship: "-5", fx: "0", fees: "NaN", local: "-1" });
    expect(p.price).toBe(0);
    expect(p.ship).toBe(DEFAULT_SHIP_USD);
    expect(p.fx).toBeNull();
    expect(p.fees).toBe(0);
    expect(p.local).toBeNull();
  });

  it("an unknown category becomes other", () => {
    expect(parseResultParams({ cat: "toys" }).cat).toBe("other");
    expect(parseResultParams({ cat: "phones" }).cat).toBe("phones");
  });

  it("upper-cases the currency and fills in its rate when fx is missing", () => {
    const p = parseResultParams({ cur: "eur" });
    expect(p.cur).toBe("EUR");
    expect(p.fx).toBe(FX_RATES.EUR);
  });

  it("a currency we have no rate for keeps its code but gets fx null", () => {
    const p = parseResultParams({ cur: "JPY" });
    expect(p.cur).toBe("JPY");
    expect(p.fx).toBeNull();
    expect(parseResultParams({ cur: "dollars" }).cur).toBeNull();
  });

  it("only keeps http(s) images", () => {
    expect(parseResultParams({ img: "javascript:alert(1)" }).img).toBeUndefined();
    expect(parseResultParams({ img: "not a url" }).img).toBeUndefined();
  });

  it("ignores junk in src", () => {
    expect(parseResultParams({ src: "price:read,cat:maybe,brand:read,,img:guess" }).src).toEqual({
      price: "read",
      img: "guess",
    });
  });

  it("takes the first value when a key is repeated", () => {
    expect(parseResultParams({ price: ["10", "20"] }).price).toBe(10);
  });
});

describe("sourcesToSrc", () => {
  it("strong parsers are read, open graph is a guess, a guessed category too", () => {
    const src = sourcesToSrc(
      { price: "shopify", currency: "json-ld", title: "shopify", image: "open-graph", brand: "shopify" },
      true,
    );
    expect(src).toEqual({ price: "read", cur: "read", title: "read", img: "guess", cat: "guess" });
  });

  it("fields nobody found get no mark", () => {
    expect(sourcesToSrc({ price: "open-graph" }, false)).toEqual({ price: "guess" });
  });
});
