/* Foods cooked once are eaten more than once: the dal made in the morning is on the plate at lunch and again at dinner, and
 * what was left from last night is lunch today. For the meal being added to, this finds those foods: what was already eaten
 * today in another meal, and what was eaten yesterday.
 *
 * Each is scored by how often this person's own days looked like that (on the days a food was eaten earlier, how often it came
 * back in this meal), starting from a guess for that kind of food (repeatChance) and letting the person's days take over as
 * they pile up. Tea that is only ever had at breakfast stops being offered; a dal that is always eaten twice is offered at once.
 * Where there are no days yet, only the kinds of food that are cooked once are offered, and leftovers from yesterday not at all.
 */
import type { Entry, LastUsed } from "../data/types.ts";
import { addDays, daysBetween } from "../lib/dates.ts";
import type { MealType } from "../nutrition/types.ts";
import { foodsInMeal } from "./usuals.ts";
import { MEAL_ORDER } from "./meals.ts";

/** How many days of guessing a food starts with before its own days count for more. */
export const PRIOR_DAYS = 3;
/** A food that is sure to be eaten again counts as this many days of eating it for the meal. */
export const SAME_DAY_WORTH = 12;
export const NEXT_DAY_WORTH = 8;
/** Leftovers from yesterday are rarer than a dish eaten twice in a day: on a guess alone they are not offered. */
export const NEXT_DAY_PRIOR_SHARE = 0.25;
/** Under this a food is not worth a place. */
export const MIN_CHANCE = 0.15;
/** Only the latest days say how this person eats now. */
export const HISTORY_DAYS = 90;
/** The further apart two meals are in the day, the less of a dish is left for the second. */
const DISTANCE_FACTOR = [1, 1, 0.85, 0.7];

export type CarryKind = "earlier" | "yesterday";

/** What was eaten today says more than what was eaten yesterday: when both point at a food, it is offered as today's. */
const KIND_RANK: Record<CarryKind, number> = { earlier: 0, yesterday: 1 };

export interface Carry {
  foodId: string;
  kind: CarryKind;
  /** The meal it was had in. */
  from: MealType;
  /** What was had then. */
  portion: LastUsed;
  /** How likely it is to be eaten again, 0 to 1. */
  chance: number;
  score: number;
}

interface Input {
  entries: Entry[];
  /** The meal being added to. */
  meal: MealType;
  /** The day being logged. */
  date: string;
  /** How likely a food is to come back before this person's own days say. */
  priorOf: (foodId: string) => number;
}

type Meals = Map<MealType, Set<string>>;

const mealIndex = (meal: MealType): number => MEAL_ORDER.indexOf(meal);

function groupByDay(entries: Entry[]): Map<string, Meals> {
  const days = new Map<string, Meals>();
  for (const e of entries) {
    const meals = days.get(e.date) ?? new Map<MealType, Set<string>>();
    meals.set(e.meal, (meals.get(e.meal) ?? new Set()).add(e.foodId));
    days.set(e.date, meals);
  }
  return days;
}

const mealsWith = (meals: Meals, foodId: string): MealType[] => [...meals].filter(([, foods]) => foods.has(foodId)).map(([meal]) => meal);

/** Of the days it was eaten earlier in the day, how often it came back in `meal`, starting from the guess for its kind. */
function sameDayChance(past: [string, Meals][], foodId: string, meal: MealType, prior: number): number {
  let earlier = 0;
  let back = 0;
  for (const [, meals] of past) {
    const where = mealsWith(meals, foodId);
    if (!where.some((m) => m !== meal && mealIndex(m) < mealIndex(meal))) continue;
    earlier += 1;
    if (where.includes(meal)) back += 1;
  }
  return (back + prior * PRIOR_DAYS) / (earlier + PRIOR_DAYS);
}

/** Of the days it was eaten the day before, how often it was eaten in `meal`. */
function nextDayChance(past: [string, Meals][], byDay: Map<string, Meals>, foodId: string, meal: MealType, prior: number): number {
  let before = 0;
  let back = 0;
  for (const [day, meals] of past) {
    const yesterday = byDay.get(addDays(day, -1));
    if (!yesterday || mealsWith(yesterday, foodId).length === 0) continue;
    before += 1;
    if (meals.get(meal)?.has(foodId)) back += 1;
  }
  const guess = prior * NEXT_DAY_PRIOR_SHARE;
  return (back + guess * PRIOR_DAYS) / (before + PRIOR_DAYS);
}

/** What was had of a food in a meal on a day: the latest entry. */
function latestIn(entries: Entry[], date: string, meal: MealType, foodId: string): Entry | undefined {
  return entries.filter((e) => e.date === date && e.meal === meal && e.foodId === foodId).sort((a, b) => b.at - a.at)[0];
}

export function carryOvers({ entries, meal, date, priorOf }: Input): Carry[] {
  const byDay = groupByDay(entries);
  const past = [...byDay].filter(([day]) => day < date && daysBetween(day, date) <= HISTORY_DAYS);
  const inMeal = foodsInMeal(entries, meal, date);
  const found = new Map<string, Carry>();
  const keep = (carry: Carry): void => {
    if (carry.chance < MIN_CHANCE) return;
    const have = found.get(carry.foodId);
    if (!have) {
      found.set(carry.foodId, carry);
      return;
    }
    // Offered under the more telling reason, and ranked on the stronger of the two.
    const moreTelling = KIND_RANK[carry.kind] - KIND_RANK[have.kind] || have.score - carry.score;
    found.set(carry.foodId, { ...(moreTelling < 0 ? carry : have), score: Math.max(have.score, carry.score) });
  };

  const today = byDay.get(date);
  if (today) {
    for (const [from, foods] of today) {
      if (from === meal) continue;
      for (const foodId of foods) {
        if (inMeal.has(foodId)) continue;
        const entry = latestIn(entries, date, from, foodId);
        if (!entry) continue;
        const chance = sameDayChance(past, foodId, meal, priorOf(foodId));
        const apart = Math.abs(mealIndex(from) - mealIndex(meal));
        keep({ foodId, kind: "earlier", from, portion: { quantity: entry.quantity, unit: entry.unit }, chance, score: SAME_DAY_WORTH * chance * DISTANCE_FACTOR[Math.min(apart, 3)] });
      }
    }
  }

  // What was eaten in this same meal yesterday is the routine, not a leftover: the usual foods already count it.
  const yesterday = byDay.get(addDays(date, -1));
  if (yesterday) {
    for (const [from, foods] of yesterday) {
      if (from === meal) continue;
      for (const foodId of foods) {
        if (inMeal.has(foodId)) continue;
        const entry = latestIn(entries, addDays(date, -1), from, foodId);
        if (!entry) continue;
        const chance = nextDayChance(past, byDay, foodId, meal, priorOf(foodId));
        keep({ foodId, kind: "yesterday", from, portion: { quantity: entry.quantity, unit: entry.unit }, chance, score: NEXT_DAY_WORTH * chance });
      }
    }
  }

  return [...found.values()].sort((a, b) => b.score - a.score || (a.foodId < b.foodId ? -1 : 1));
}
