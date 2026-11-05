import { readFileSync } from "node:fs";
import { load } from "cheerio";
import { describe, expect, it, vi } from "vitest";
import { isChallenge } from "@/lib/scrape/challenge";
import { jsonLdParser } from "@/lib/scrape/parsers/jsonLd";
import { openGraphParser } from "@/lib/scrape/parsers/openGraph";
import { matchesShopify, shopifyParser } from "@/lib/scrape/parsers/shopify";
import { scrapeProduct } from "@/lib/scrape/scrape";
import type { ScrapeContext } from "@/lib/scrape/types";

const PAGE = "https://shop.example.com/products/linen-overshirt";

function fixture(name: string): string {
  return readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
}

// any test that reaches this has touched the network by mistake
const noNetwork = async (): Promise<unknown> => {
  throw new Error("no network in tests");
};

function ctx(html: string | null, url = PAGE, fetchJson = noNetwork): ScrapeContext {
  return { url: new URL(url), html, $: html ? load(html) : null, fetchJson };
}

// what Shopify's /products/<handle>.js answers, trimmed to what we read
const shopifyJson = {
  title: "Linen Overshirt",
  vendor: "Example Co",
  price: 7900,
  featured_image: "//cdn.shopify.com/s/files/overshirt.jpg",
};

describe("shopify", () => {
  it("matches product paths, with or without a collection or locale", () => {
    expect(matchesShopify(new URL("https://a.com/products/shirt"))).toBe(true);
    expect(matchesShopify(new URL("https://a.com/products/shirt/"))).toBe(true);
    expect(matchesShopify(new URL("https://a.com/collections/new/products/shirt"))).toBe(true);
    expect(matchesShopify(new URL("https://a.com/en-us/products/shirt"))).toBe(true);
  });

  it("doesn't match other paths or the .js endpoint itself", () => {
    expect(matchesShopify(new URL("https://a.com/products"))).toBe(false);
    expect(matchesShopify(new URL("https://a.com/products/shirt.js"))).toBe(false);
    expect(matchesShopify(new URL("https://a.com/collections/shirts"))).toBe(false);
    expect(matchesShopify(new URL("https://a.com/"))).toBe(false);
  });

  it("reads the .js endpoint: cents to units, https image, vendor as brand", async () => {
    const fetchJson = vi.fn(async () => shopifyJson);
    const info = await shopifyParser.parse(ctx(null, PAGE, fetchJson));

    expect(fetchJson).toHaveBeenCalledWith(`${PAGE}.js`);
    expect(info).toEqual({
      title: "Linen Overshirt",
      brand: "Example Co",
      image: "https://cdn.shopify.com/s/files/overshirt.jpg",
      price: 79,
    });
  });

  it("asks for /x.js, not /x/.js, when the link ends in a slash", async () => {
    const fetchJson = vi.fn(async () => shopifyJson);
    await shopifyParser.parse(ctx(null, `${PAGE}/?variant=1`, fetchJson));
    expect(fetchJson).toHaveBeenCalledWith(`${PAGE}.js?variant=1`);
  });

  it("reads a price string and falls back to the first image", async () => {
    const fetchJson = async () => ({ title: "Tee", price: "1999", images: ["https://a.com/t.jpg"] });
    const info = await shopifyParser.parse(ctx(null, PAGE, fetchJson));
    expect(info?.price).toBeCloseTo(19.99);
    expect(info?.image).toBe("https://a.com/t.jpg");
  });

  it("gives null when the fetch fails or there's no title", async () => {
    expect(await shopifyParser.parse(ctx(null))).toBeNull();
    expect(await shopifyParser.parse(ctx(null, PAGE, async () => ({ price: 100 })))).toBeNull();
    expect(await shopifyParser.parse(ctx(null, PAGE, async () => "not json"))).toBeNull();
  });

  it("doesn't fetch anything for a non-product link", async () => {
    const fetchJson = vi.fn(async () => shopifyJson);
    expect(await shopifyParser.parse(ctx(null, "https://a.com/about", fetchJson))).toBeNull();
    expect(fetchJson).not.toHaveBeenCalled();
  });
});

describe("json-ld", () => {
  it("skips a broken script and survives a raw line break inside a string", async () => {
    expect(await jsonLdParser.parse(ctx(fixture("jsonld-product.html")))).toEqual({
      title: "Linen Overshirt",
      brand: "Example Co",
      image: "https://shop.example.com/img/overshirt.jpg",
      price: 79,
      currency: "USD",
    });
  });

  it("finds the product inside @graph, with image as { url } and lowPrice", async () => {
    expect(await jsonLdParser.parse(ctx(fixture("jsonld-graph.html")))).toEqual({
      title: "Rose Serum",
      brand: "Glow",
      image: "https://glow.example.com/serum.jpg",
      price: 24.5,
      currency: "GBP",
    });
  });

  it("reads a top-level array, a schema.org type url, a brand list and the first offer", async () => {
    expect(await jsonLdParser.parse(ctx(fixture("jsonld-offers-array.html")))).toEqual({
      title: "Wool Sweater",
      brand: "Knit Co",
      image: "/media/sweater.jpg", // made absolute later, by the merge
      price: 1299,
      currency: "EUR",
    });
  });

  it("takes price and image from the first variant of a ProductGroup", async () => {
    expect(await jsonLdParser.parse(ctx(fixture("jsonld-product-group.html")))).toEqual({
      title: "Cotton Tee",
      brand: "Basics",
      image: "https://basics.example.com/tee-s.jpg",
      price: 19.99,
      currency: "USD",
    });
  });

  it("gives null when there's no product data", async () => {
    expect(await jsonLdParser.parse(ctx(fixture("og-only.html")))).toBeNull();
    expect(await jsonLdParser.parse(ctx(fixture("empty.html")))).toBeNull();
    expect(await jsonLdParser.parse(ctx(null))).toBeNull();
  });
});

describe("open graph", () => {
  it("reads the og and product tags", async () => {
    expect(await openGraphParser.parse(ctx(fixture("og-only.html")))).toEqual({
      title: "Leather Jacket",
      brand: "Atelier",
      image: "/images/jacket.jpg",
      price: 1299,
      currency: "eur", // upper-cased later, by the merge
    });
  });

  it("accepts name= instead of property=, and takes the currency from the amount", async () => {
    const html = `<meta name="og:title" content="Cap"><meta name="og:price:amount" content="$25">`;
    const info = await openGraphParser.parse(ctx(html));
    expect(info?.title).toBe("Cap");
    expect(info?.price).toBe(25);
    expect(info?.currency).toBe("USD");
  });

  it("falls back to <title> when there are other tags", async () => {
    const html = `<title>Cap | Shop</title><meta property="og:image" content="/cap.jpg">`;
    expect((await openGraphParser.parse(ctx(html)))?.title).toBe("Cap | Shop");
  });

  it("gives null when there are no og or product tags, even with a <title>", async () => {
    expect(await openGraphParser.parse(ctx(fixture("empty.html")))).toBeNull();
    expect(await openGraphParser.parse(ctx("<html><body></body></html>"))).toBeNull();
  });
});

describe("isChallenge", () => {
  it("spots a bot checkpoint page", () => {
    expect(isChallenge(fixture("challenge.html"))).toBe(true);
  });

  it("ignores a marker on a big page: real product pages are long", () => {
    expect(isChallenge(fixture("challenge.html") + "x".repeat(20_000))).toBe(false);
  });

  it("lets a normal page through", () => {
    expect(isChallenge(fixture("jsonld-product.html"))).toBe(false);
  });
});

describe("scrapeProduct", () => {
  const texts = (steps: { text: string }[]) => steps.map((s) => s.text);

  it("shopify first, then json-ld fills the currency, then stops", async () => {
    const r = await scrapeProduct(new URL(PAGE), fixture("jsonld-product.html"), async () => ({
      ...shopifyJson,
      title: "Linen Overshirt (shopify)",
    }));

    expect(r.info.title).toBe("Linen Overshirt (shopify)");
    expect(r.info.currency).toBe("USD");
    expect(r.sources).toMatchObject({ title: "shopify", price: "shopify", currency: "json-ld" });
    expect(r.strong).toBe(true);
    expect(texts(r.steps)).toEqual([
      "shopify storefront detected",
      "product data read",
      "reading price",
      "price found in product data",
    ]);
    expect(r.steps.every((s) => s.ok)).toBe(true);
  });

  it("a complete json-ld page never reaches open graph", async () => {
    const r = await scrapeProduct(
      new URL("https://glow.example.com/serum"),
      fixture("jsonld-graph.html"),
      noNetwork,
    );
    expect(Object.values(r.sources)).not.toContain("open-graph");
    expect(texts(r.steps)).not.toContain("details found in page tags");
  });

  it("open graph only: weak, image made absolute, currency upper-cased", async () => {
    const r = await scrapeProduct(new URL("https://shop.example.com/jacket"), fixture("og-only.html"), noNetwork);
    expect(r.strong).toBe(false);
    expect(r.info).toMatchObject({
      price: 1299,
      currency: "EUR",
      image: "https://shop.example.com/images/jacket.jpg",
    });
  });

  it("page blocked but shopify answered: keeps the shopify data", async () => {
    const r = await scrapeProduct(new URL(PAGE), null, async () => shopifyJson);
    expect(r.info.price).toBe(79);
    expect(r.info.currency).toBeUndefined();
    expect(r.sources.price).toBe("shopify");
  });

  it("nothing found: the last step is a failure", async () => {
    const r = await scrapeProduct(new URL("https://shop.example.com/"), fixture("empty.html"), noNetwork);
    expect(r.info.price).toBeUndefined();
    expect(r.steps.at(-1)).toMatchObject({ text: "no price on this page", ok: false });
  });

  it("a /products/ link that isn't shopify: no shopify step, no failure", async () => {
    const r = await scrapeProduct(new URL(PAGE), fixture("jsonld-product.html"), noNetwork);
    expect(texts(r.steps).some((t) => t.includes("shopify"))).toBe(false);
    expect(r.steps.every((s) => s.ok)).toBe(true);
    expect(r.info.price).toBe(79); // json-ld found it
  });
});
