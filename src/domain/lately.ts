/* How often each food was eaten lately, on how many different days. */
import type { Entry } from "../data/types.ts";
import { daysBetween } from "../lib/dates.ts";

/** "Lately" is this many days back. */
export const LATELY_DAYS = 30;
/** A food eaten on this many days lately is one the person is eating a lot of. */
export const OFTEN_DAYS = 3;

/** For each food, on how many different days of the last `window` days it was logged. Days after today are not counted. */
export function daysEatenIn(entries: Entry[], today: string, window = LATELY_DAYS): Map<string, number> {
  const days = new Map<string, Set<string>>();
  for (const e of entries) {
    const ago = daysBetween(e.date, today);
    if (ago < 0 || ago >= window) continue;
    days.set(e.foodId, (days.get(e.foodId) ?? new Set()).add(e.date));
  }
  return new Map([...days].map(([id, set]) => [id, set.size]));
}
