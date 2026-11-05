import { describe, expect, it } from "vitest";
import { mergeProduct } from "@/lib/scrape/merge";
import type { Parser } from "@/lib/scrape/types";

const page = new URL("https://shop.example.com/products/overshirt");

// fake parsers: the merge only looks at name and strong
const shopify: Parser = { name: "shopify", strong: true, parse: async () => null };
const jsonLd: Parser = { name: "json-ld", strong: true, parse: async () => null };
const og: Parser = { name: "open-graph", strong: false, parse: async () => null };

describe("mergeProduct", () => {
  it("first value wins per field, and records where each came from", () => {
    const m = mergeProduct(
      [
        { parser: shopify, info: { title: "Overshirt", price: 79 } },
        { parser: jsonLd, info: { title: "Other title", price: 99, currency: "USD" } },
        { parser: og, info: { image: "https://cdn.example.com/a.jpg", brand: "Shop" } },
      ],
      page,
    );

    expect(m.info).toEqual({
      title: "Overshirt",
      price: 79,
      currency: "USD",
      image: "https://cdn.example.com/a.jpg",
      brand: "Shop",
    });
    expect(m.sources).toEqual({
      title: "shopify",
      price: "shopify",
      currency: "json-ld",
      image: "open-graph",
      brand: "open-graph",
    });
  });

  it("strong when any field came from shopify or json-ld", () => {
    expect(mergeProduct([{ parser: jsonLd, info: { title: "x" } }], page).strong).toBe(true);
    expect(mergeProduct([{ parser: og, info: { title: "x", price: 5 } }], page).strong).toBe(false);
  });

  it("a strong parser that adds nothing new doesn't make it strong", () => {
    const m = mergeProduct(
      [
        { parser: og, info: { title: "x" } },
        { parser: jsonLd, info: { title: "y" } },
      ],
      page,
    );
    expect(m.strong).toBe(false);
  });

  it("makes a relative image absolute against the page", () => {
    const m = mergeProduct([{ parser: og, info: { image: "/img/shirt.jpg" } }], page);
    expect(m.info.image).toBe("https://shop.example.com/img/shirt.jpg");
  });

  it("drops images that aren't http(s)", () => {
    const m = mergeProduct([{ parser: og, info: { image: "javascript:alert(1)" } }], page);
    expect(m.info.image).toBeUndefined();
    expect(m.sources.image).toBeUndefined();
  });

  it("skips blanks and zero prices, so a later parser can fill them", () => {
    const m = mergeProduct(
      [
        { parser: shopify, info: { title: "  ", price: 0 } },
        { parser: og, info: { title: "  Jacket ", price: 120 } },
      ],
      page,
    );
    expect(m.info.title).toBe("Jacket");
    expect(m.info.price).toBe(120);
    expect(m.sources).toEqual({ title: "open-graph", price: "open-graph" });
  });

  it("upper-cases the currency", () => {
    const m = mergeProduct([{ parser: og, info: { currency: "eur" } }], page);
    expect(m.info.currency).toBe("EUR");
  });

  it("complete only with title, price, currency and image", () => {
    const full = { title: "x", price: 1, currency: "USD", image: "https://a.com/i.jpg" };
    expect(mergeProduct([{ parser: og, info: full }], page).isComplete).toBe(true);
    expect(
      mergeProduct([{ parser: og, info: { ...full, currency: undefined } }], page).isComplete,
    ).toBe(false);
  });
});
