/* The ways a month's food is cut up for the Insights charts: by macro, by meal, by weekday, by food, by streak. */
import type { Entry } from "../data/types.ts";
import type { MealType, NutritionTotals } from "../nutrition/types.ts";
import { MEAL_ORDER } from "./meals.ts";
import { KCAL_PER_G } from "./goals.ts";
import { monthOf, weekdayIndex, type MonthId } from "./month.ts";
import { isCounted, type DayStat } from "./monthInsights.ts";
import { addDays } from "../lib/dates.ts";

export interface MacroShares {
  protein: number;
  carbs: number;
  fat: number;
}

/** Where the calories of the macros come from, as shares that add to 1. Null when there are none. */
export function macroShares(t: Pick<NutritionTotals, "protein" | "carbs" | "fat">): MacroShares | null {
  const protein = t.protein * KCAL_PER_G.protein;
  const carbs = t.carbs * KCAL_PER_G.carbs;
  const fat = t.fat * KCAL_PER_G.fat;
  const total = protein + carbs + fat;
  return total > 0 ? { protein: protein / total, carbs: carbs / total, fat: fat / total } : null;
}

/** The entries that fall on counted days: the ones the month's averages are made from. */
export function countedEntries(entries: Entry[], days: DayStat[]): Entry[] {
  const counted = new Set(days.filter(isCounted).map((d) => d.date));
  return entries.filter((e) => counted.has(e.date));
}

/** Calories of one counted day that came from each meal, on average. */
export function mealAverages(entries: Entry[], days: DayStat[]): Record<MealType, number> {
  const counted = new Set(days.filter(isCounted).map((d) => d.date));
  const totals: Record<MealType, number> = { breakfast: 0, lunch: 0, snack: 0, dinner: 0 };
  for (const e of entries) if (counted.has(e.date)) totals[e.meal] += e.nutrition.calories;
  const n = Math.max(counted.size, 1);
  return Object.fromEntries(MEAL_ORDER.map((m) => [m, totals[m] / n])) as Record<MealType, number>;
}

export interface WeekdayAverage {
  /** Monday is 0. */
  weekday: number;
  /** Calories on an average counted day of this weekday, or null when there was none. */
  average: number | null;
  count: number;
}

export function weekdayAverages(days: DayStat[]): WeekdayAverage[] {
  const sums = Array.from({ length: 7 }, () => ({ total: 0, count: 0 }));
  for (const d of days.filter(isCounted)) {
    const bucket = sums[weekdayIndex(d.date)];
    bucket.total += d.totals.calories;
    bucket.count += 1;
  }
  return sums.map((b, weekday) => ({ weekday, average: b.count > 0 ? b.total / b.count : null, count: b.count }));
}

export interface TopFood {
  foodId: string;
  name: string;
  calories: number;
  /** How many times it was logged. */
  times: number;
}

/** The foods that supplied the most calories in the month. */
export function topFoods(entries: Entry[], month: MonthId, limit: number): TopFood[] {
  const byFood = new Map<string, TopFood>();
  for (const e of entries) {
    if (monthOf(e.date) !== month) continue;
    const row = byFood.get(e.foodId) ?? { foodId: e.foodId, name: e.name, calories: 0, times: 0 };
    row.calories += e.nutrition.calories;
    row.times += 1;
    byFood.set(e.foodId, row);
  }
  return [...byFood.values()].sort((a, b) => b.calories - a.calories || b.times - a.times || a.name.localeCompare(b.name)).slice(0, limit);
}

/** Days in a row with something logged, counting back from today (or from yesterday while today is still empty). */
export function currentStreak(loggedDates: ReadonlySet<string>, today: string): number {
  let day = loggedDates.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (loggedDates.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}

/** The longest run of logged days inside the month. */
export function longestStreak(days: DayStat[]): number {
  let best = 0;
  let run = 0;
  for (const d of days) {
    run = d.logged ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}
