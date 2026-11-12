/* How a logged day went against the calorie goal, and the logged days put together by week, for History. */
import { addDays, parseISODate } from "../lib/dates.ts";

/** A little over the goal is still the goal: portions are guesses. */
export const OVER_TOLERANCE = 1.05;
/** Close enough under the goal to count as on track. */
const ON_TRACK_MIN = 0.85;
const DAYS_IN_WEEK = 7;
const MONDAY = 1;

export type DayVerdictKind = "over" | "onTrack" | "under";

export interface DayVerdict {
  kind: DayVerdictKind;
  /** Calories past the goal (over) or short of it (under); 0 when on track. */
  amount: number;
}

export function dayVerdict(calories: number, goal: number): DayVerdict {
  if (goal <= 0) return { kind: "onTrack", amount: 0 };
  if (calories > goal * OVER_TOLERANCE) return { kind: "over", amount: Math.round(calories - goal) };
  if (calories >= goal * ON_TRACK_MIN) return { kind: "onTrack", amount: 0 };
  return { kind: "under", amount: Math.round(goal - calories) };
}

/** The Monday a day's week starts on. */
export function weekStartOf(iso: string): string {
  const weekday = parseISODate(iso).getDay();
  return addDays(iso, -((weekday - MONDAY + DAYS_IN_WEEK) % DAYS_IN_WEEK));
}

export interface WeekGroup<T> {
  /** The Monday of that week. */
  start: string;
  items: T[];
}

/** Items in the order given, put together by the week of their date. Weeks keep the order their first item came in. */
export function groupByWeek<T>(items: T[], dateOf: (item: T) => string): WeekGroup<T>[] {
  const groups: WeekGroup<T>[] = [];
  for (const item of items) {
    const start = weekStartOf(dateOf(item));
    const last = groups[groups.length - 1];
    if (last?.start === start) last.items.push(item);
    else groups.push({ start, items: [item] });
  }
  return groups;
}
