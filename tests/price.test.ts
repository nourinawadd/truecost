import { describe, expect, it } from "vitest";
import { parseCurrency, parsePrice } from "@/lib/scrape/price";

describe("parsePrice", () => {
  it("reads the formats from the spec", () => {
    expect(parsePrice("1.299,00 €")).toBe(1299); // european: dot thousands, comma decimal
    expect(parsePrice("$1,299.00")).toBe(1299); // us: comma thousands, dot decimal
    expect(parsePrice("1 299,50")).toBe(1299.5); // space thousands
    expect(parsePrice("12")).toBe(12);
  });

  it("one separator: three digits after it means thousands", () => {
    expect(parsePrice("1,299")).toBe(1299);
    expect(parsePrice("1.299")).toBe(1299);
    expect(parsePrice("1,299,000")).toBe(1299000);
  });

  it("one separator: one or two digits after it means a decimal", () => {
    expect(parsePrice("12,99")).toBe(12.99);
    expect(parsePrice("12.5")).toBe(12.5);
  });

  it("reads only the first number, so a range doesn't glue into one", () => {
    expect(parsePrice("$12.99 - $19.99")).toBe(12.99);
    expect(parsePrice("12.99-19.99")).toBe(12.99);
    expect(parsePrice("from 12,99 € to 19,99 €")).toBe(12.99);
    expect(parsePrice("12.99. free shipping")).toBe(12.99); // trailing dot isn't a separator
    expect(parsePrice("1 299 999,00")).toBe(1299999);
  });

  it("garbage gives null", () => {
    expect(parsePrice("free")).toBeNull();
    expect(parsePrice(".,")).toBeNull();
    expect(parsePrice("")).toBeNull();
    expect(parsePrice(null)).toBeNull();
    expect(parsePrice(undefined)).toBeNull();
  });
});

describe("parseCurrency", () => {
  it("reads symbols", () => {
    expect(parseCurrency("$12")).toBe("USD");
    expect(parseCurrency("1.299,00 €")).toBe("EUR");
    expect(parseCurrency("£40")).toBe("GBP");
  });

  it("reads a three-letter code before or after the number", () => {
    expect(parseCurrency("EUR 12")).toBe("EUR");
    expect(parseCurrency("12 aed")).toBe("AED");
  });

  it("a bare ¥ is unknown: it could be CNY or JPY", () => {
    expect(parseCurrency("¥1200")).toBeNull();
  });

  it("a dollar with letters in front is not USD, unless it's US$", () => {
    expect(parseCurrency("US$12")).toBe("USD");
    expect(parseCurrency("CA$12")).toBeNull();
    expect(parseCurrency("A$ 30")).toBeNull();
    expect(parseCurrency("HK$99")).toBeNull();
  });

  it("unknown or empty gives null", () => {
    expect(parseCurrency("12")).toBeNull();
    expect(parseCurrency("free")).toBeNull();
    expect(parseCurrency("")).toBeNull();
    expect(parseCurrency(undefined)).toBeNull();
  });
});
