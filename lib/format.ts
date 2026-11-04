import type { Range } from "@/lib/cost/calculate";

// 7911.5 → "7,912". Rounding ourselves keeps halves going up.
export function formatEgp(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

// "7,912 – 8,694", or one number when both ends round the same
export function formatRange(r: Range): string {
  const low = formatEgp(r.low);
  const high = formatEgp(r.high);
  return low === high ? low : `${low} – ${high}`;
}

// fractions in: { low: 0.71, high: 0.79 } → "71–79%", or "71%"
export function formatPercentRange(r: Range): string {
  const low = Math.round(r.low * 100);
  const high = Math.round(r.high * 100);
  return low === high ? `${low}%` : `${low}–${high}%`;
}
