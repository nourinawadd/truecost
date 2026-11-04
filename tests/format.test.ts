import { describe, expect, it } from "vitest";
import { getCategory } from "@/data/categories";
import { calculateLandedCost } from "@/lib/cost/calculate";
import { formatEgp, formatPercentRange, formatRange } from "@/lib/format";

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
    const r = calculateLandedCost({
      price: 79,
      shipping: 12,
      fx: 50,
      category: getCategory("clothing"),
      feesEgp: 0,
    });
    expect(formatRange(r.total)).toBe("6,743 – 7,262");
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
