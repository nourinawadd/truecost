import type { Category } from "@/data/categories";
import type { Range } from "@/lib/cost/calculate";

// 7911.5 → "7,912". Rounding ourselves keeps halves going up.
export function formatEgp(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

// true when both ends show as the same whole number, like the canvas checks
export function isSingleValue(r: Range): boolean {
  return Math.round(r.low) === Math.round(r.high);
}

// "7,912 – 8,694", or one number when both ends round the same
export function formatRange(r: Range): string {
  return isSingleValue(r) ? formatEgp(r.low) : `${formatEgp(r.low)} – ${formatEgp(r.high)}`;
}

// fractions in: { low: 0.71, high: 0.79 } → "71–79%", or "71%"
export function formatPercentRange(r: Range): string {
  const low = Math.round(r.low * 100);
  const high = Math.round(r.high * 100);
  return low === high ? `${low}%` : `${low}–${high}%`;
}

// A category's duty rule as people read it: "30–40%", "38.5%", or
// "rate to be added". Keeps one decimal, which formatPercentRange would round off.
export function formatRate(category: Category): string {
  const pct = (fraction: number) => Number((fraction * 100).toFixed(1));
  if (category.kind === "band") return `${pct(category.low)}–${pct(category.high)}%`;
  if (category.kind === "flat") return `${pct(category.rate)}%`;
  return "rate to be added";
}

// "2026-11-01" → "01.11.26", the way the design writes dates
export function formatShortDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}.${month}.${year.slice(2)}`;
}
