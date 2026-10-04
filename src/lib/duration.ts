const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30.44;
const DAYS_PER_YEAR = 365;
const WEEKS_FROM_DAYS = 14;
const MONTHS_FROM_DAYS = 70;
const YEARS_FROM_DAYS = 2 * DAYS_PER_YEAR;

export interface SpanParts {
  /** What goes before the number: "over" for years, since they are counted down. */
  prefix: string;
  value: number;
  unit: string;
}

/** A length of time as a number and the unit that reads best: 9 days, 6 weeks, 5 months, over 2 years. */
export function spanParts(days: number): SpanParts {
  const d = Math.max(1, Math.round(days));
  const count = (value: number, one: string, many: string, prefix = ""): SpanParts => ({ prefix, value, unit: value === 1 ? one : many });
  if (d < WEEKS_FROM_DAYS) return count(d, "day", "days");
  if (d < MONTHS_FROM_DAYS) return count(Math.round(d / DAYS_PER_WEEK), "week", "weeks");
  if (d < YEARS_FROM_DAYS) return count(Math.round(d / DAYS_PER_MONTH), "month", "months");
  return count(Math.floor(d / DAYS_PER_YEAR), "year", "years", "over ");
}

/** "9 days", "6 weeks", "5 months", "over 2 years". */
export function formatSpan(days: number): string {
  const { prefix, value, unit } = spanParts(days);
  return `${prefix}${value} ${unit}`;
}
