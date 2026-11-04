import type { Range } from "@/lib/cost/calculate";

export type Verdict =
  | { kind: "none" } // no local price yet
  | { kind: "buy-local"; extra: Range } // how much more importing costs
  | { kind: "import"; saves: Range } // how much importing saves
  | { kind: "too-close" }; // the local price sits inside the estimate

// Same rules as the calculator in design/Result.dc.html
export function compareWithLocal(total: Range, localEgp: number | null): Verdict {
  if (localEgp === null || !(localEgp > 0)) return { kind: "none" };

  if (localEgp < total.low) {
    return { kind: "buy-local", extra: { low: total.low - localEgp, high: total.high - localEgp } };
  }
  if (localEgp > total.high) {
    return { kind: "import", saves: { low: localEgp - total.high, high: localEgp - total.low } };
  }
  return { kind: "too-close" };
}
