import type { Category } from "@/data/categories";
import { VAT_RATE } from "@/data/config";

export type Range = { low: number; high: number };

export type CostInput = {
  price: number; // in the shop's currency
  shipping: number; // in the shop's currency
  fx: number; // EGP for one unit of that currency
  category: Category;
  feesEgp: number;
};

export type CostBreakdown = {
  itemEgp: number;
  shippingEgp: number;
  cif: number;
  duty: Range;
  vat: Range;
  fees: number;
  total: Range;
  isRange: boolean;
  pending: boolean; // the category has no rate yet
};

// NaN, Infinity and negative numbers count as 0, so bad input never throws
function safe(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// The formula from CLAUDE.md. No rounding here: that's for display.
export function calculateLandedCost(input: CostInput): CostBreakdown {
  const fx = safe(input.fx);
  const itemEgp = safe(input.price) * fx;
  const shippingEgp = safe(input.shipping) * fx;
  const cif = itemEgp + shippingEgp;
  const fees = safe(input.feesEgp);
  const category = input.category;

  let duty: Range = { low: 0, high: 0 };
  let vat: Range = { low: 0, high: 0 };

  if (category.kind === "band") {
    duty = { low: cif * category.low, high: cif * category.high };
    vat = { low: (cif + duty.low) * VAT_RATE, high: (cif + duty.high) * VAT_RATE };
  } else if (category.kind === "flat") {
    // phones: one flat rate replaces duty and vat
    duty = { low: cif * category.rate, high: cif * category.rate };
  }

  const total: Range = {
    low: cif + duty.low + vat.low + fees,
    high: cif + duty.high + vat.high + fees,
  };

  return {
    itemEgp,
    shippingEgp,
    cif,
    duty,
    vat,
    fees,
    total,
    isRange: total.low !== total.high,
    pending: category.kind === "pending",
  };
}
