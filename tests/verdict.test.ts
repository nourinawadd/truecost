import { describe, expect, it } from "vitest";
import { compareWithLocal } from "@/lib/cost/verdict";

const total = { low: 6743.1, high: 7261.8 };

describe("compareWithLocal", () => {
  it("below the range: buy local, and says how much more importing costs", () => {
    const v = compareWithLocal(total, 6000, false);
    expect(v.kind).toBe("buy-local");
    if (v.kind !== "buy-local") return;
    expect(v.extra.low).toBeCloseTo(743.1);
    expect(v.extra.high).toBeCloseTo(1261.8);
  });

  it("inside the range: too close to call", () => {
    expect(compareWithLocal(total, 7000, false)).toEqual({ kind: "too-close" });
  });

  it("exactly on either edge: still too close to call", () => {
    expect(compareWithLocal(total, 6743.1, false)).toEqual({ kind: "too-close" });
    expect(compareWithLocal(total, 7261.8, false)).toEqual({ kind: "too-close" });
  });

  it("above the range: import it, and says how much you save", () => {
    const v = compareWithLocal(total, 9000, false);
    expect(v.kind).toBe("import");
    if (v.kind !== "import") return;
    expect(v.saves.low).toBeCloseTo(1738.2);
    expect(v.saves.high).toBeCloseTo(2256.9);
  });

  it("no local price yet: no verdict", () => {
    expect(compareWithLocal(total, null, false)).toEqual({ kind: "none" });
    expect(compareWithLocal(total, 0, false)).toEqual({ kind: "none" });
    expect(compareWithLocal(total, NaN, false)).toEqual({ kind: "none" });
  });

  it("category with no rate yet: pending, with or without a local price", () => {
    expect(compareWithLocal(total, 6000, true)).toEqual({ kind: "pending" });
    expect(compareWithLocal(total, null, true)).toEqual({ kind: "pending" });
  });
});
