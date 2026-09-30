const LOCALE = "en-IN";

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString(LOCALE);
}

export function formatGrams(n: number): string {
  return `${formatNumber(n)} g`;
}

/** Parses what someone typed into a number field; anything unreadable is NaN. */
export function parseNumber(text: string): number {
  const n = Number(text.replace(/,/g, "").trim());
  return text.trim() === "" ? Number.NaN : n;
}

/** "medium banana" -> "Medium banana". Only the first letter changes, so "2 dosa (plate)" style text stays intact. */
export function sentenceCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const MEASURED_UNITS = new Set(["g", "ml"]);

/** How a stored portion reads on screen: "1 medium banana" -> "1 × Medium banana", "200 g" stays "200 g". */
export function formatPortionText(text: string): string {
  const match = /^(\d+(?:\.\d+)?)\s+(.+)$/.exec(text.trim());
  if (!match) return sentenceCase(text);
  const [, amount, rest] = match;
  return MEASURED_UNITS.has(rest) ? `${amount} ${rest}` : `${amount} × ${sentenceCase(rest)}`;
}

const QUANTITY_DECIMALS = 2;

/** 1.5, 2, 0.25: no trailing zeros. */
export function formatQuantity(quantity: number): string {
  return String(Number(quantity.toFixed(QUANTITY_DECIMALS)));
}
