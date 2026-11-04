import { describe, expect, it } from "vitest";
import { getCategory } from "@/data/categories";
import { calculateLandedCost, type CostInput } from "@/lib/cost/calculate";
import { formatEgp, formatPercentRange, formatRange, isSingleValue } from "@/lib/format";

// the design canvas defaults: USD 79 item, USD 12 shipping, 1 USD = 50 EGP
const canvas: CostInput = {
  price: 79,
  fx: 50,
  shippingUsd: 12,
  usdFx: 50,
  category: getCategory("clothing"),
  feesEgp: 0,
};

describe("formatEgp", () => {
  it("groups thousands with commas and drops decimals", () => {
    expect(formatEgp(0)).toBe("0");
    expect(formatEgp(950)).toBe("950");
    expect(formatEgp(7912)).toBe("7,912");
    expect(formatEgp(1234567.4)).toBe("1,234,567");
  });

  it("rounds halves up", () => {
    expect(formatEgp(7911.5)).toBe("7,912");
    expect(formatEgp(7911.49)).toBe("7,911");
  });
});

describe("formatRange", () => {
  it("shows low – high with a spaced en dash", () => {
    expect(formatRange({ low: 7912, high: 8694 })).toBe("7,912 – 8,694");
  });

  it("shows one number when both ends round the same", () => {
    expect(formatRange({ low: 6301.75, high: 6301.75 })).toBe("6,302");
    expect(formatRange({ low: 7911.6, high: 7912.4 })).toBe("7,912");
  });

  it("matches the design canvas for the clothing defaults", () => {
    expect(formatRange(calculateLandedCost(canvas).total)).toBe("6,743 – 7,262");
  });
});

describe("isSingleValue", () => {
  it("a 0.01 USD item: the ends differ but both round to 1, so one value", () => {
    // cif 0.01 × 50 = 0.5
    // low: 0.5 + 0.15 + (0.65 × 0.14 = 0.091) = 0.741
    // high: 0.5 + 0.2 + (0.7 × 0.14 = 0.098) = 0.798
    const r = calculateLandedCost({ ...canvas, price: 0.01, shippingUsd: 0 });
    expect(r.total.low).not.toBe(r.total.high);
    expect(isSingleValue(r.total)).toBe(true);
  });

  it("the clothing defaults are a range", () => {
    expect(isSingleValue(calculateLandedCost(canvas).total)).toBe(false);
  });

  it("phones are one value", () => {
    const r = calculateLandedCost({ ...canvas, category: getCategory("phones") });
    expect(isSingleValue(r.total)).toBe(true);
  });
});

describe("formatPercentRange", () => {
  it("turns fractions into whole percents", () => {
    expect(formatPercentRange({ low: 0.71, high: 0.71 })).toBe("71%");
  });

  it("shows a range with an unspaced en dash, like the canvas", () => {
    expect(formatPercentRange({ low: 0.707, high: 0.788 })).toBe("71–79%");
  });

  it("shows one percent when both ends round the same", () => {
    expect(formatPercentRange({ low: 0.712, high: 0.714 })).toBe("71%");
  });
});
