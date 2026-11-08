export const VAT_RATE = 0.14;

export type Currency = "USD" | "EUR" | "GBP" | "AED" | "CNY";

export const FX_RATES: Record<Currency, number> = {
  USD: 50,
  EUR: 54,
  GBP: 63,
  AED: 13.6,
  CNY: 7,
};

export const FX_AS_OF = "2026-11-08";

export const SHIPPING_BANDS = [
  { id: "0-0.5", label: "under 0.5 kg", usd: 8 },
  { id: "0.5-1", label: "0.5 to 1 kg", usd: 12 },
  { id: "1-2", label: "1 to 2 kg", usd: 20 },
  { id: "2-5", label: "2 to 5 kg", usd: 40 },
] as const;

type ShippingBandId = (typeof SHIPPING_BANDS)[number]["id"];

export const DEFAULT_SHIPPING_BAND: ShippingBandId = "0.5-1";

export const DEFAULT_FEES_EGP = 0;
