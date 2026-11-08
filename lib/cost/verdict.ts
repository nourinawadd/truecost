import type { Range } from "@/lib/cost/calculate";

export type Verdict =
  | { kind: "pending" }
  | { kind: "none" }
  | { kind: "buy-local"; extra: Range }
  | { kind: "import"; saves: Range }
  | { kind: "too-close" };

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
