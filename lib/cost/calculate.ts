import type { Category } from "@/data/categories";
import { VAT_RATE } from "@/data/config";

export type Range = { low: number; high: number };

export type CostInput = {
  price: number;
  fx: number;
  shippingUsd: number;
  usdFx: number;
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
  pending: boolean;
};

function safe(n: number): number {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function calculateLandedCost(input: CostInput): CostBreakdown {
  const itemEgp = safe(input.price) * safe(input.fx);
  const shippingEgp = safe(input.shippingUsd) * safe(input.usdFx);
  const cif = itemEgp + shippingEgp;
  const fees = safe(input.feesEgp);
  const category = input.category;

  let duty: Range = { low: 0, high: 0 };
  let vat: Range = { low: 0, high: 0 };

  if (category.kind === "band") {
    duty = { low: cif * category.low, high: cif * category.high };
    vat = { low: (cif + duty.low) * VAT_RATE, high: (cif + duty.high) * VAT_RATE };
  } else if (category.kind === "flat") {
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
    pending: category.kind === "pending",
  };
}
