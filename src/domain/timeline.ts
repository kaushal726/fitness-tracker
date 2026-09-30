/* How long someone gives themselves to reach a target weight. It is stored as weeks (fractions are
 * fine) and entered as days, weeks or months, so nobody is stuck with a fixed list of choices.
 */
export type TimelineUnit = "days" | "weeks" | "months";

const DAYS_PER_WEEK = 7;
const WEEKS_PER_MONTH = 52 / 12;

/** A week is the shortest timeline that makes sense, five years the longest. */
export const MIN_WEEKS = 1;
export const MAX_WEEKS = 260;

export const TIMELINE_UNITS: { value: TimelineUnit; label: string }[] = [
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
];

/** Quick picks for each unit. Anything else can be typed. */
export const TIMELINE_PRESETS: Record<TimelineUnit, number[]> = {
  days: [30, 45, 60, 90],
  weeks: [4, 8, 12, 16, 24],
  months: [3, 6, 9, 12, 18],
};

export const DEFAULT_TIMELINE: { value: number; unit: TimelineUnit } = { value: 12, unit: "weeks" };

/** Months are rounded to whole weeks: a fraction of a week is noise at this scale. */
export function toWeeks(value: number, unit: TimelineUnit): number {
  if (unit === "days") return value / DAYS_PER_WEEK;
  if (unit === "months") return Math.round(value * WEEKS_PER_MONTH);
  return value;
}

/** Whole weeks read best as weeks; anything else reads best as days. */
export function fromWeeks(weeks: number): { value: number; unit: TimelineUnit } {
  return Number.isInteger(weeks) ? { value: weeks, unit: "weeks" } : { value: Math.round(weeks * DAYS_PER_WEEK), unit: "days" };
}

/** The same duration in another unit, as a whole number (at least 1), for when the unit switch keeps the time. */
export function weeksToUnit(weeks: number, unit: TimelineUnit): number {
  const raw = unit === "days" ? weeks * DAYS_PER_WEEK : unit === "months" ? weeks / WEEKS_PER_MONTH : weeks;
  return Math.max(1, Math.round(raw));
}

export function formatTimeline(weeks: number): string {
  const { value, unit } = fromWeeks(weeks);
  return `${value} ${value === 1 ? unit.slice(0, -1) : unit}`;
}

export function isValidWeeks(weeks: number): boolean {
  return Number.isFinite(weeks) && weeks >= MIN_WEEKS && weeks <= MAX_WEEKS;
}
