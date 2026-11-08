export function parsePrice(raw: string | null | undefined): number | null {
  if (!raw) return null;

  const first = raw.match(/\d(?:[.,]?\d|[   ](?=\d{3}(?!\d)))*/);
  if (!first) return null;

  const cleaned = first[0].replace(/[^\d.,]/g, "");

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalised: string;

  if (lastComma >= 0 && lastDot >= 0) {
    const decimal = lastComma > lastDot ? "," : ".";
    const thousands = decimal === "," ? "." : ",";
    normalised = cleaned.split(thousands).join("");
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

function disambiguate(cleaned: string, separator: string): string {
  const parts = cleaned.split(separator);
  const tail = parts[parts.length - 1];

  if (parts.length > 2 || tail.length === 3) return parts.join("");
  return parts.join(".");
}

const SYMBOLS: Record<string, string> = { $: "USD", "€": "EUR", "£": "GBP" };

export function parseCurrency(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const letters = raw.replace(/[^a-z]/gi, "");
  if (letters.length === 3) return letters.toUpperCase();

  const prefixed = raw.match(/([a-z]+)\$/i);
  if (prefixed) return prefixed[1].toUpperCase() === "US" ? "USD" : null;

  for (const [symbol, code] of Object.entries(SYMBOLS)) {
    if (raw.includes(symbol)) return code;
  }
  return null;
}
