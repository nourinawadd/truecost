// Numbers the calculator uses. Simplified demo data, not official rates.

export const VAT_RATE = 0.14;

export type Currency = "USD" | "EUR" | "GBP" | "AED" | "CNY";

// EGP for one unit of each currency
// TODO(nourin): update before submitting (placeholders)
export const FX_RATES: Record<Currency, number> = {
  USD: 50,
  EUR: 54,
  GBP: 63,
  AED: 13.6,
  CNY: 7,
};

// the date FX_RATES were taken, shown next to the rates
// TODO(nourin): update before submitting
export const FX_AS_OF = "2026-11-01";

// forwarder shipping estimate in USD by parcel weight
export const SHIPPING_BANDS = [
  { id: "0-0.5", label: "under 0.5 kg", usd: 8 }, // TODO(nourin)
  { id: "0.5-1", label: "0.5 to 1 kg", usd: 12 }, // TODO(nourin)
  { id: "1-2", label: "1 to 2 kg", usd: 20 }, // TODO(nourin)
  { id: "2-5", label: "2 to 5 kg", usd: 40 }, // TODO(nourin)
];

export const DEFAULT_SHIPPING_BAND = "0.5-1";

export const DEFAULT_FEES_EGP = 0;
