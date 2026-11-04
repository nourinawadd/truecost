import type { Range } from "@/lib/cost/calculate";

export type Verdict =
  | { kind: "pending" } // the category has no rate yet, so nothing to compare
  | { kind: "none" } // no local price yet
  | { kind: "buy-local"; extra: Range } // how much more importing costs
  | { kind: "import"; saves: Range } // how much importing saves
  | { kind: "too-close" }; // the local price sits inside the estimate

// Same rules as the calculator in design/Result.dc.html.
// `pending` is the breakdown's flag: without a rate the total has no duty in it.
export function compareWithLocal(
  total: Range,
  localEgp: number | null,
  pending: boolean,
): Verdict {
  if (pending) return { kind: "pending" };
  if (localEgp === null || !(localEgp > 0)) return { kind: "none" };

  if (localEgp < total.low) {
    return { kind: "buy-local", extra: { low: total.low - localEgp, high: total.high - localEgp } };
  }
  if (localEgp > total.high) {
    return { kind: "import", saves: { low: localEgp - total.high, high: localEgp - total.low } };
  }
  return { kind: "too-close" };
}
