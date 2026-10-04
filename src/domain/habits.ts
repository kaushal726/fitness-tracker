/* Habits behind the numbers: which meals are eaten, when, and how much sugar and salt came with them. */
import type { Entry } from "../data/types.ts";
import type { MealType, NutritionTotals } from "../nutrition/types.ts";
import { MEAL_ORDER } from "./meals.ts";
import { isCounted, type DayStat } from "./monthInsights.ts";

/** WHO: under about 2,000 mg of sodium (5 g of salt) a day. */
export const SODIUM_LIMIT_MG = 2000;
/** WHO: free sugars under 10% of the day's energy. Our figure counts all sugars, fruit and milk too, so it is a guide. */
export const SUGAR_ENERGY_SHARE = 0.1;
const KCAL_PER_G_SUGAR = 4;

export const sugarLimitG = (goalCalories: number): number => (goalCalories * SUGAR_ENERGY_SHARE) / KCAL_PER_G_SUGAR;

export interface SugarSalt {
  countedDays: number;
  sugar: number;
  sodium: number;
  sugarDaysOver: number;
  sodiumDaysOver: number;
}

/** Sugar and sodium on an average counted day, and on how many days each passed its limit. Null before there is a counted day. */
export function sugarSalt(days: DayStat[], goalCalories: number): SugarSalt | null {
  const counted = days.filter(isCounted);
  if (counted.length === 0) return null;
  const limit = sugarLimitG(goalCalories);
  const total = (pick: (t: NutritionTotals) => number): number => counted.reduce((sum, d) => sum + pick(d.totals), 0);
  return {
    countedDays: counted.length,
    sugar: total((t) => t.sugar) / counted.length,
    sodium: total((t) => t.sodium) / counted.length,
    sugarDaysOver: counted.filter((d) => d.totals.sugar > limit).length,
    sodiumDaysOver: counted.filter((d) => d.totals.sodium > SODIUM_LIMIT_MG).length,
  };
}

export interface MealHabit {
  meal: MealType;
  /** Counted days with something logged for this meal. */
  days: number;
  countedDays: number;
}

/** How many counted days each meal was logged on: the ones skipped show up as low numbers. */
export function mealHabits(entries: Entry[], days: DayStat[]): MealHabit[] {
  const counted = new Set(days.filter(isCounted).map((d) => d.date));
  const seen = new Map<MealType, Set<string>>(MEAL_ORDER.map((m) => [m, new Set<string>()]));
  for (const e of entries) if (counted.has(e.date)) seen.get(e.meal)?.add(e.date);
  return MEAL_ORDER.map((meal) => ({ meal, days: seen.get(meal)?.size ?? 0, countedDays: counted.size }));
}

export interface ClockBlock {
  id: string;
  label: string;
  /** Where the block starts, short enough to print under a column: "9am". */
  tick: string;
  calories: number;
  /** Of all the counted days' calories, 0 to 1. */
  share: number;
}

/** Hours the day is cut at: each block runs from its hour to the next one, and the last wraps round the night to the first. */
const BLOCKS: { id: string; label: string; tick: string; from: number }[] = [
  { id: "early", label: "5–9 am", tick: "5am", from: 5 },
  { id: "morning", label: "9 am–12 pm", tick: "9am", from: 9 },
  { id: "afternoon", label: "12–3 pm", tick: "12pm", from: 12 },
  { id: "tea", label: "3–6 pm", tick: "3pm", from: 15 },
  { id: "evening", label: "6–9 pm", tick: "6pm", from: 18 },
  { id: "night", label: "9 pm–5 am", tick: "9pm", from: 21 },
];

export const LATE_NIGHT_BLOCK = "night";

function blockOf(hour: number): string {
  if (hour < BLOCKS[0].from) return LATE_NIGHT_BLOCK;
  for (let i = BLOCKS.length - 1; i >= 0; i--) if (hour >= BLOCKS[i].from) return BLOCKS[i].id;
  return LATE_NIGHT_BLOCK;
}

/** Calories by the time of day they were logged. It is when the entry was made, which is usually when it was eaten. */
export function eatingClock(entries: Entry[], days: DayStat[]): ClockBlock[] {
  const counted = new Set(days.filter(isCounted).map((d) => d.date));
  const totals = new Map<string, number>(BLOCKS.map((b) => [b.id, 0]));
  for (const e of entries) {
    if (!counted.has(e.date)) continue;
    const id = blockOf(new Date(e.at).getHours());
    totals.set(id, (totals.get(id) ?? 0) + e.nutrition.calories);
  }
  const sum = [...totals.values()].reduce((a, b) => a + b, 0);
  return BLOCKS.map((b) => ({ id: b.id, label: b.label, tick: b.tick, calories: totals.get(b.id) ?? 0, share: sum > 0 ? (totals.get(b.id) ?? 0) / sum : 0 }));
}
