import { ZERO_TOTALS } from "../nutrition/constants.ts";
import { addTotals } from "../nutrition/math.ts";
import { getFoodById } from "../nutrition/registry.ts";
import type { Food, MealType, NutritionTotals } from "../nutrition/types.ts";
import { MEAL_ORDER } from "../domain/meals.ts";
import { addDays, todayISO } from "../lib/dates.ts";
import type { Entry } from "./types.ts";

export type FoodLookup = (id: string) => Food | undefined;

export function makeFoodLookup(customFoods: Food[]): FoodLookup {
  const custom = new Map(customFoods.map((f) => [f.id, f]));
  return (id) => custom.get(id) ?? getFoodById(id);
}

export function entriesOn(entries: Entry[], date: string): Entry[] {
  return entries.filter((e) => e.date === date).sort((a, b) => a.at - b.at);
}

export function sumEntries(entries: Entry[]): NutritionTotals {
  return entries.reduce((sum, e) => addTotals(sum, e.nutrition), ZERO_TOTALS);
}

export function groupByMeal(entries: Entry[]): Record<MealType, Entry[]> {
  const groups = Object.fromEntries(MEAL_ORDER.map((m) => [m, [] as Entry[]])) as Record<MealType, Entry[]>;
  for (const e of entries) groups[e.meal].push(e);
  return groups;
}

/** Food ids, most recently logged first, without repeats. */
export function recentFoodIds(entries: Entry[], limit: number): string[] {
  const seen = new Set<string>();
  for (const e of [...entries].sort((a, b) => b.at - a.at)) {
    seen.add(e.foodId);
    if (seen.size >= limit) break;
  }
  return [...seen];
}

const FREQUENT_WINDOW_DAYS = 30;

/** Food ids logged most often in the last month. */
export function frequentFoodIds(entries: Entry[], limit: number, today = todayISO()): string[] {
  const from = addDays(today, -FREQUENT_WINDOW_DAYS);
  const counts = new Map<string, number>();
  for (const e of entries) if (e.date >= from) counts.set(e.foodId, (counts.get(e.foodId) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
}

/** Dates that have any entries, newest first. */
export function loggedDates(entries: Entry[]): string[] {
  return [...new Set(entries.map((e) => e.date))].sort().reverse();
}
