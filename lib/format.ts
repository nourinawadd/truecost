import type { Category } from "@/data/categories";
import type { Range } from "@/lib/cost/calculate";

export function formatEgp(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function isSingleValue(r: Range): boolean {
  return Math.round(r.low) === Math.round(r.high);
}

export function formatRange(r: Range): string {
  return isSingleValue(r) ? formatEgp(r.low) : `${formatEgp(r.low)} – ${formatEgp(r.high)}`;
}

export function formatPercentRange(r: Range): string {
  const low = Math.round(r.low * 100);
  const high = Math.round(r.high * 100);
  return low === high ? `${low}%` : `${low}–${high}%`;
}

export function formatRate(category: Category): string {
  const pct = (fraction: number) => Number((fraction * 100).toFixed(1));
  if (category.kind === "band") return `${pct(category.low)}–${pct(category.high)}%`;
  if (category.kind === "flat") return `${pct(category.rate)}%`;
  return "rate to be added";
}

export function formatShortDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}.${month}.${year.slice(2)}`;
}
