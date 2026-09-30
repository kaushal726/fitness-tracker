import { QUOTES } from "./library.ts";
import type { Quote } from "./types.ts";

const MS_PER_DAY = 86_400_000;
const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/** Whole days since 1970-01-01 for a calendar day (YYYY-MM-DD). Ignores time zones and daylight saving. */
export function dayNumber(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

/** FNV-1a: a small, stable hash, so a quote's place in the rotation depends only on its own id. */
function hashOf(text: string): number {
  let hash = FNV_OFFSET;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

/**
 * The order quotes come round in. Sorted by a hash of the id, so adding a quote leaves most of the order
 * as it was, then nudged so that two neighbours do not share a theme.
 */
export function rotationOrder(quotes: readonly Quote[]): Quote[] {
  const order = quotes
    .map((quote) => ({ quote, key: hashOf(quote.id) }))
    .sort((a, b) => a.key - b.key || (a.quote.id < b.quote.id ? -1 : 1))
    .map(({ quote }) => quote);
  for (let i = 1; i < order.length; i++) {
    if (order[i].theme !== order[i - 1].theme) continue;
    const swapWith = order.findIndex((quote, j) => j > i && quote.theme !== order[i - 1].theme);
    if (swapWith !== -1) [order[i], order[swapWith]] = [order[swapWith], order[i]];
  }
  return order;
}

const ROTATION = rotationOrder(QUOTES);

/** The thought of the day: the same for everyone on the same date, and nothing repeats until every quote has had its turn. */
export function quoteForDay(iso: string, rotation: readonly Quote[] = ROTATION): Quote {
  const size = rotation.length;
  return rotation[((dayNumber(iso) % size) + size) % size];
}
