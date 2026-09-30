import type { Settings } from "../data/types.ts";
import type { MealType } from "../nutrition/types.ts";

export const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "snack", "dinner"];

export const MEAL_LABELS: Record<MealType, string> = { breakfast: "Breakfast", lunch: "Lunch", snack: "Snack", dinner: "Dinner" };

/** 6 AM breakfast, 11 AM lunch, 4 PM snack, 7 PM dinner. */
export const DEFAULT_MEAL_STARTS: Settings["mealStartHours"] = { breakfast: 6, lunch: 11, snack: 16, dinner: 19 };

const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;

/** The meal a time of day belongs to: the latest one that has started. Before breakfast it is still last night's dinner. */
export function mealForTime(when: Date, starts: Settings["mealStartHours"] = DEFAULT_MEAL_STARTS): MealType {
  const hour = when.getHours() + when.getMinutes() / MINUTES_IN_HOUR;
  const started = MEAL_ORDER.filter((m) => starts[m] <= hour);
  return started.length ? started[started.length - 1] : MEAL_ORDER[MEAL_ORDER.length - 1];
}

/** Meal start hours are valid when strictly increasing within one day. */
export function isValidMealStarts(starts: Settings["mealStartHours"]): boolean {
  return MEAL_ORDER.every((m, i) => starts[m] >= 0 && starts[m] < HOURS_IN_DAY && (i === 0 || starts[MEAL_ORDER[i - 1]] < starts[m]));
}

export function formatHour(hour: number): string {
  const whole = Math.floor(hour);
  const minutes = Math.round((hour - whole) * MINUTES_IN_HOUR);
  const suffix = whole >= 12 ? "PM" : "AM";
  const twelve = whole % 12 === 0 ? 12 : whole % 12;
  return `${twelve}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""} ${suffix}`;
}
