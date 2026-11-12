/* Meal reminders: a time of day for each meal, sent as a phone notification by a small push server
 * (push-worker/), which only ever learns the minutes of the day and the time zone.
 */
import type { MealType } from "../nutrition/types.ts";
import { MEAL_ORDER } from "./meals.ts";

export interface Reminders {
  enabled: boolean;
  /** Hour of the day (quarters allowed) to be reminded of each meal. */
  times: Record<MealType, number>;
}

/** 8:30 AM, 1:30 PM, 5 PM, 8:30 PM: a little after each meal usually starts, when there is something to log. */
export const DEFAULT_REMINDERS: Reminders = { enabled: false, times: { breakfast: 8.5, lunch: 13.5, snack: 17, dinner: 20.5 } };
/** A reminder moves by a quarter of an hour. */
export const REMINDER_STEP = 0.25;
const MINUTES_IN_HOUR = 60;
const LAST_TIME = 24 - REMINDER_STEP;

/** Each reminder as a minute of the day (0 to 1439), in meal order, for the push server. */
export function reminderMinutes(times: Reminders["times"]): number[] {
  return MEAL_ORDER.map((m) => Math.round(times[m] * MINUTES_IN_HOUR));
}

/** A time kept on the quarter hour and inside the day. */
export function clampReminder(hour: number): number {
  const stepped = Math.round(hour / REMINDER_STEP) * REMINDER_STEP;
  return Math.min(LAST_TIME, Math.max(0, stepped));
}
