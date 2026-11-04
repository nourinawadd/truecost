import { describe, expect, it } from "vitest";
import { getCategory } from "@/data/categories";
import { calculateLandedCost, type CostInput } from "@/lib/cost/calculate";

// the canvas defaults: USD 79 item, USD 12 shipping, 1 USD = 50 EGP, no fees
const base: CostInput = {
  price: 79,
  fx: 50,
  shippingUsd: 12,
  usdFx: 50,
  category: getCategory("clothing"),
  feesEgp: 0,
};

describe("calculateLandedCost", () => {
  it("clothing: duty band 30–40%, then 14% vat on cif + duty", () => {
    const r = calculateLandedCost(base);

    // item 79 × 50 = 3950, shipping 12 × 50 = 600, cif = 4550
    expect(r.itemEgp).toBeCloseTo(3950);
    expect(r.shippingEgp).toBeCloseTo(600);
    expect(r.cif).toBeCloseTo(4550);
    // duty: 4550 × 0.30 = 1365, 4550 × 0.40 = 1820
    expect(r.duty.low).toBeCloseTo(1365);
    expect(r.duty.high).toBeCloseTo(1820);
    // vat: (4550 + 1365) × 0.14 = 828.1, (4550 + 1820) × 0.14 = 891.8
    expect(r.vat.low).toBeCloseTo(828.1);
    expect(r.vat.high).toBeCloseTo(891.8);
    // total: 4550 + 1365 + 828.1 = 6743.1, 4550 + 1820 + 891.8 = 7261.8
    expect(r.total.low).toBeCloseTo(6743.1);
    expect(r.total.high).toBeCloseTo(7261.8);
    expect(r.pending).toBe(false);
  });

  it("cosmetics: the wider 30–60% band gives a wider range", () => {
    const clothing = calculateLandedCost(base);
    const r = calculateLandedCost({ ...base, category: getCategory("cosmetics") });

    // duty high: 4550 × 0.60 = 2730, vat high: (4550 + 2730) × 0.14 = 1019.2
    // total high: 4550 + 2730 + 1019.2 = 8299.2
    expect(r.duty.high).toBeCloseTo(2730);
    expect(r.total.low).toBeCloseTo(6743.1);
    expect(r.total.high).toBeCloseTo(8299.2);
    expect(r.total.high - r.total.low).toBeGreaterThan(
      clothing.total.high - clothing.total.low,
    );
  });

  it("prices the item in the shop's currency and shipping in USD", () => {
    // a EUR shop: item 100 EUR × 54 = 5400, shipping 12 USD × 50 = 600, cif = 6000
    const r = calculateLandedCost({ ...base, price: 100, fx: 54 });

    expect(r.itemEgp).toBeCloseTo(5400);
    expect(r.shippingEgp).toBeCloseTo(600);
    expect(r.cif).toBeCloseTo(6000);
  });

  it("phones: flat 38.5% replaces duty and vat, so no range", () => {
    const r = calculateLandedCost({ ...base, category: getCategory("phones") });

    // 4550 × 0.385 = 1751.75, total 4550 + 1751.75 = 6301.75
    expect(r.duty.low).toBeCloseTo(1751.75);
    expect(r.duty.high).toBeCloseTo(1751.75);
    expect(r.vat).toEqual({ low: 0, high: 0 });
    expect(r.total.low).toBeCloseTo(6301.75);
    expect(r.total.high).toBeCloseTo(6301.75);
  });

  it("pending category: flagged, no duty or vat, total is cif + fees", () => {
    const r = calculateLandedCost({ ...base, category: getCategory("books"), feesEgp: 50 });

    expect(r.pending).toBe(true);
    expect(r.duty).toEqual({ low: 0, high: 0 });
    expect(r.vat).toEqual({ low: 0, high: 0 });
    // 4550 + 50
    expect(r.total.low).toBeCloseTo(4600);
    expect(r.total.high).toBeCloseTo(4600);
  });

  it("adds fees once to both ends of the range", () => {
    const without = calculateLandedCost(base);
    const withFees = calculateLandedCost({ ...base, feesEgp: 100 });

    expect(withFees.fees).toBe(100);
    expect(withFees.total.low - without.total.low).toBeCloseTo(100);
    expect(withFees.total.high - without.total.high).toBeCloseTo(100);
  });

  it("treats zero, negative and NaN inputs as 0 without throwing", () => {
    const zero = { low: 0, high: 0 };
    for (const bad of [0, -5, NaN]) {
      const r = calculateLandedCost({
        price: bad,
        fx: bad,
        shippingUsd: bad,
        usdFx: bad,
        category: getCategory("clothing"),
        feesEgp: bad,
      });
      expect(r.cif).toBe(0);
      expect(r.fees).toBe(0);
      expect(r.duty).toEqual(zero);
      expect(r.vat).toEqual(zero);
      expect(r.total).toEqual(zero);
    }
  });
});
