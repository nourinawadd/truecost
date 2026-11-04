import { describe, expect, it } from "vitest";
import { compareWithLocal } from "@/lib/cost/verdict";

// the clothing estimate for the canvas defaults
const total = { low: 6743.1, high: 7261.8 };

describe("compareWithLocal", () => {
  it("below the range: buy local, and says how much more importing costs", () => {
    const v = compareWithLocal(total, 6000);
    expect(v.kind).toBe("buy-local");
    if (v.kind !== "buy-local") return;
    // 6743.1 − 6000 = 743.1, 7261.8 − 6000 = 1261.8
    expect(v.extra.low).toBeCloseTo(743.1);
    expect(v.extra.high).toBeCloseTo(1261.8);
  });

  it("inside the range: too close to call", () => {
    expect(compareWithLocal(total, 7000)).toEqual({ kind: "too-close" });
  });

  it("exactly on either edge: still too close to call", () => {
    expect(compareWithLocal(total, 6743.1)).toEqual({ kind: "too-close" });
    expect(compareWithLocal(total, 7261.8)).toEqual({ kind: "too-close" });
  });

  it("above the range: import it, and says how much you save", () => {
    const v = compareWithLocal(total, 9000);
    expect(v.kind).toBe("import");
    if (v.kind !== "import") return;
    // 9000 − 7261.8 = 1738.2, 9000 − 6743.1 = 2256.9
    expect(v.saves.low).toBeCloseTo(1738.2);
    expect(v.saves.high).toBeCloseTo(2256.9);
  });

  it("no local price yet: no verdict", () => {
    expect(compareWithLocal(total, null)).toEqual({ kind: "none" });
    expect(compareWithLocal(total, 0)).toEqual({ kind: "none" });
    expect(compareWithLocal(total, NaN)).toEqual({ kind: "none" });
  });
});
