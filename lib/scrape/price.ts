// Port of HOLD's PriceNormaliser: shops write prices many ways.

// "1.299,00 €" → 1299, "$1,299.00" → 1299, "1 299,50" → 1299.5, garbage → null
export function parsePrice(raw: string | null | undefined): number | null {
  if (!raw) return null;

  // Only the first number: "$12.99 - $19.99" is a range, not 129991999.
  // A separator must sit between digits; a space counts only when three
  // digits follow it, like the thousands space in "1 299,50".
  const first = raw.match(/\d(?:[.,]?\d|[   ](?=\d{3}(?!\d)))*/);
  if (!first) return null;

  const cleaned = first[0].replace(/[^\d.,]/g, "");

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalised: string;

  if (lastComma >= 0 && lastDot >= 0) {
    // both appear: whichever comes last is the decimal point
    const decimal = lastComma > lastDot ? "," : ".";
    const thousands = decimal === "," ? "." : ",";
    normalised = cleaned.split(thousands).join("");
    // "1.2.3,00" style leftovers: keep only the last decimal mark
    const at = normalised.lastIndexOf(decimal);
    normalised = normalised.slice(0, at).split(decimal).join("") + "." + normalised.slice(at + 1);
  } else if (lastComma >= 0 || lastDot >= 0) {
    normalised = disambiguate(cleaned, lastComma >= 0 ? "," : ".");
  } else {
    normalised = cleaned;
  }

  const value = Number(normalised);
  return Number.isFinite(value) ? value : null;
}

// Only one kind of separator. "1,299" and "1,299,000" are thousands;
// "12,99" is a decimal comma.
function disambiguate(cleaned: string, separator: string): string {
  const parts = cleaned.split(separator);
  const tail = parts[parts.length - 1];

  if (parts.length > 2 || tail.length === 3) return parts.join("");
  return parts.join(".");
}

// A bare ¥ is not here on purpose: it could be CNY or JPY (see CLAUDE.md).
const SYMBOLS: Record<string, string> = { $: "USD", "€": "EUR", "£": "GBP" };

// "EUR 12" → "EUR", "$12" → "USD", "¥1200" → null, "CA$12" → null
export function parseCurrency(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const letters = raw.replace(/[^a-z]/gi, "");
  if (letters.length === 3) return letters.toUpperCase();

  // "CA$", "A$", "HK$", "R$": a dollar, but not the US one. We don't guess
  // which, the user picks. Only "US$" counts as USD.
  const prefixed = raw.match(/([a-z]+)\$/i);
  if (prefixed) return prefixed[1].toUpperCase() === "US" ? "USD" : null;

  for (const [symbol, code] of Object.entries(SYMBOLS)) {
    if (raw.includes(symbol)) return code;
  }
  return null;
}
