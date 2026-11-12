/* Reminders: one for each meal at a time of your choosing, and water every so often through the day. A small push
 * server (push-worker/) sends them; it only ever learns minutes of the day and the time zone.
 */
import type { MealType } from "../nutrition/types.ts";
import { MEAL_ORDER } from "./meals.ts";

export interface Reminders {
  enabled: boolean;
  /** Hour of the day (quarters allowed) to be reminded of each meal. */
  times: Record<MealType, number>;
}

export interface WaterReminders {
  enabled: boolean;
  /** The first and the last reminder of the day, as hours (quarters allowed). */
  from: number;
  to: number;
  /** Hours between two reminders. */
  everyHours: number;
}

/** 8:30 AM, 1:30 PM, 5 PM, 8:30 PM: a little after each meal usually starts, when there is something to log. */
export const DEFAULT_REMINDERS: Reminders = { enabled: false, times: { breakfast: 8.5, lunch: 13.5, snack: 17, dinner: 20.5 } };
/** Every two hours from 9 AM to 9 PM. */
export const DEFAULT_WATER_REMINDERS: WaterReminders = { enabled: false, from: 9, to: 21, everyHours: 2 };
export const WATER_INTERVALS = [1, 1.5, 2, 3] as const;
/** A reminder moves by a quarter of an hour. */
export const REMINDER_STEP = 0.25;
const MINUTES_IN_HOUR = 60;
const LAST_TIME = 24 - REMINDER_STEP;

const toMinute = (hour: number): number => Math.round(hour * MINUTES_IN_HOUR);

/** Each meal reminder as a minute of the day (0 to 1439), in meal order. */
export function reminderMinutes(times: Reminders["times"]): number[] {
  return MEAL_ORDER.map((m) => toMinute(times[m]));
}

/** The hours of the water reminders: from the first, every so often, up to the last. */
export function waterReminderHours({ from, to, everyHours }: WaterReminders): number[] {
  if (everyHours <= 0 || to < from) return [];
  const hours: number[] = [];
  for (let h = from; h <= to + 1e-9; h += everyHours) hours.push(h);
  return hours;
}

/** A time kept on the quarter hour and inside the day. */
export function clampReminder(hour: number): number {
  const stepped = Math.round(hour / REMINDER_STEP) * REMINDER_STEP;
  return Math.min(LAST_TIME, Math.max(0, stepped));
}

export type PlannedReminder = { minute: number; kind: "meal"; meal: MealType } | { minute: number; kind: "water" };

/**
 * Every reminder of the day that is on, in time order. The phone keeps this list so its service worker can tell what a
 * push at a given minute is for; the server gets only the minutes. A meal wins a minute it shares with water.
 */
export function reminderPlan(meals: Reminders, water: WaterReminders): PlannedReminder[] {
  const byMinute = new Map<number, PlannedReminder>();
  if (water.enabled) for (const h of waterReminderHours(water)) byMinute.set(toMinute(h), { minute: toMinute(h), kind: "water" });
  if (meals.enabled) for (const meal of MEAL_ORDER) byMinute.set(toMinute(meals.times[meal]), { minute: toMinute(meals.times[meal]), kind: "meal", meal });
  return [...byMinute.values()].sort((a, b) => a.minute - b.minute);
}
