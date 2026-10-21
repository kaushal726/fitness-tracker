/* What a person usually eats, worked out from what they logged, for the meal they are adding to.
 *
 * A food's score is how many days it was logged for that meal, each day counting less the longer ago it was (a habit
 * from last month says more than one from last year) and a little more when it fell on the same weekday as the day being
 * logged. What is already in the meal on that day is left out, and what usually comes with it is lifted: someone who has
 * logged a dosa is offered the coffee they have with it. The amount offered is the one logged most often.
 */
import type { Entry, LastUsed } from "../data/types.ts";
import { daysBetween } from "../lib/dates.ts";
import type { MealType } from "../nutrition/types.ts";
import { weekdayIndex } from "./month.ts";

/** A day's weight halves every this many days. */
export const HALF_LIFE_DAYS = 45;
/** A day of the same weekday as the one being logged counts this much more: a Sunday breakfast is not a Monday one. */
export const SAME_WEEKDAY_FACTOR = 1.3;
/** How much a food that usually comes with what is already in the meal is lifted, against how often it is eaten at all. */
export const WITH_MEAL_FACTOR = 1.5;
/** A food eaten once, long ago, says nothing about today. */
export const MIN_SCORE = 0.2;

export interface Usual {
  foodId: string;
  /** The amount logged most often, lately more than long ago. */
  portion: LastUsed;
  /** How many days it was logged on. */
  days: number;
  score: number;
}

interface Input {
  entries: Entry[];
  /** The meal being added to; null looks at every meal at once and leaves nothing out. */
  meal: MealType | null;
  /** The day being logged: what is already in the meal on it is left out, and what usually comes with it is lifted. */
  date: string;
  /** The day the history is measured back from. */
  today: string;
}

interface FoodStats {
  /** Each day the food was logged on, with that day's weight. */
  days: Map<string, number>;
  portions: Map<string, { portion: LastUsed; weight: number; latest: string }>;
  latest: string;
}

/** The foods already logged for a meal on a day. */
export function foodsInMeal(entries: Entry[], meal: MealType, date: string): Set<string> {
  return new Set(entries.filter((e) => e.date === date && e.meal === meal).map((e) => e.foodId));
}

/** How much a day says about today: less the older it is, more when it is the same weekday as the day being logged. */
function dayWeight(day: string, today: string, date: string): number {
  const recency = 0.5 ** (Math.max(0, daysBetween(day, today)) / HALF_LIFE_DAYS);
  return weekdayIndex(day) === weekdayIndex(date) ? recency * SAME_WEEKDAY_FACTOR : recency;
}

function statsByFood(entries: Entry[], today: string, date: string): Map<string, FoodStats> {
  const byFood = new Map<string, FoodStats>();
  for (const e of entries) {
    const weight = dayWeight(e.date, today, date);
    const stats = byFood.get(e.foodId) ?? { days: new Map(), portions: new Map(), latest: e.date };
    stats.days.set(e.date, weight);
    if (e.date > stats.latest) stats.latest = e.date;
    const key = `${e.quantity}|${e.unit}`;
    const seen = stats.portions.get(key) ?? { portion: { quantity: e.quantity, unit: e.unit }, weight: 0, latest: e.date };
    seen.weight += weight;
    if (e.date > seen.latest) seen.latest = e.date;
    stats.portions.set(key, seen);
    byFood.set(e.foodId, stats);
  }
  return byFood;
}

const newestFirst = (a: string, b: string): number => (a < b ? 1 : a > b ? -1 : 0);

function usualPortion(stats: FoodStats): LastUsed {
  const [best] = [...stats.portions.values()].sort((a, b) => b.weight - a.weight || newestFirst(a.latest, b.latest));
  return best.portion;
}

/** For every other food, how much of its time it shared a meal with the foods already in this one (weighted like any other day). */
function withMealScores(entries: Entry[], already: Set<string>, today: string, date: string): Map<string, number> {
  const lifts = new Map<string, number>();
  if (already.size === 0) return lifts;
  const byDay = new Map<string, Set<string>>();
  for (const e of entries) byDay.set(e.date, (byDay.get(e.date) ?? new Set()).add(e.foodId));
  for (const [day, foods] of byDay) {
    if (day === date) continue;
    const shared = [...already].filter((id) => foods.has(id)).length;
    if (shared === 0) continue;
    const lift = dayWeight(day, today, date) * (shared / already.size);
    for (const id of foods) if (!already.has(id)) lifts.set(id, (lifts.get(id) ?? 0) + lift);
  }
  return lifts;
}

/** The foods this person eats for the meal, the likeliest first. */
export function usualFoods({ entries, meal, date, today }: Input): Usual[] {
  const scoped = meal === null ? entries : entries.filter((e) => e.meal === meal);
  const already = meal === null ? new Set<string>() : foodsInMeal(entries, meal, date);
  const lifts = withMealScores(scoped, already, today, date);

  const ranked: { usual: Usual; latest: string }[] = [];
  for (const [foodId, stats] of statsByFood(scoped, today, date)) {
    if (already.has(foodId)) continue;
    const score = [...stats.days.values()].reduce((sum, w) => sum + w, 0) + WITH_MEAL_FACTOR * (lifts.get(foodId) ?? 0);
    if (score < MIN_SCORE) continue;
    ranked.push({ usual: { foodId, portion: usualPortion(stats), days: stats.days.size, score }, latest: stats.latest });
  }
  return ranked
    .sort((a, b) => b.usual.score - a.usual.score || newestFirst(a.latest, b.latest) || (a.usual.foodId < b.usual.foodId ? -1 : 1))
    .map((r) => r.usual);
}
