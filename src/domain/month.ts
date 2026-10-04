/* Calendar months, written the way their dates start: "2026-10". Local time throughout, like the rest of the app. */
import { parseISODate } from "../lib/dates.ts";

export type MonthId = string;

const WEEKDAYS_PER_WEEK = 7;

export const monthOf = (iso: string): MonthId => iso.slice(0, 7);

function parts(month: MonthId): [number, number] {
  const [year, number] = month.split("-").map(Number);
  return [year, number];
}

export function daysInMonth(month: MonthId): number {
  const [year, number] = parts(month);
  return new Date(year, number, 0).getDate();
}

/** Every date of the month, first to last. */
export function monthDates(month: MonthId): string[] {
  return Array.from({ length: daysInMonth(month) }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
}

export function shiftMonth(month: MonthId, delta: number): MonthId {
  const [year, number] = parts(month);
  const moved = new Date(year, number - 1 + delta, 1);
  return `${moved.getFullYear()}-${String(moved.getMonth() + 1).padStart(2, "0")}`;
}

/** "October 2026". */
export function monthLabel(month: MonthId): string {
  return parseISODate(`${month}-01`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

/** Monday is 0 and Sunday is 6: weeks start on Monday. */
export function weekdayIndex(iso: string): number {
  return (parseISODate(iso).getDay() + WEEKDAYS_PER_WEEK - 1) % WEEKDAYS_PER_WEEK;
}
