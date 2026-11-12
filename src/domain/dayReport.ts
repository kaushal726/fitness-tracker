/* One day's food in the shape the shared picture needs: the totals, the targets, and each meal with what was in it. */
import type { Entry, Targets } from "../data/types.ts";
import { KCAL_PER_G, ZERO_TOTALS } from "../nutrition/constants.ts";
import { addTotals } from "../nutrition/math.ts";
import type { MealType, NutritionTotals } from "../nutrition/types.ts";
import { MEAL_LABELS, MEAL_ORDER } from "./meals.ts";

const PERCENT = 100;
export interface DayReportItem {
  name: string;
  /** "2 roti", "200 g". */
  portion: string;
  calories: number;
  protein: number;
}

export interface DayReportMeal {
  meal: MealType;
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** When the first food of the meal was logged (ms). */
  at: number;
  items: DayReportItem[];
}

/** Whole percents of the day's calories that come from each macro; they add up to 100, or are all 0 when no macros were logged. */
export interface EnergySplit {
  protein: number;
  carbs: number;
  fat: number;
}

export interface DayReport {
  date: string;
  totals: NutritionTotals;
  targets: Targets;
  /** Only the meals that have something logged, in the order of the day. */
  meals: DayReportMeal[];
  itemCount: number;
  energySplit: EnergySplit;
}

export interface CalorieBalance {
  over: boolean;
  /** Whole kcal left, or over when `over`; never negative. */
  amount: number;
}

/** What is left of the day's calories, or by how much it went over, so the number and the word always agree. */
export function calorieBalance(calories: number, goal: number): CalorieBalance {
  const left = Math.round(goal) - Math.round(calories);
  return { over: left < 0, amount: Math.abs(left) };
}

/** The share of calories from protein, carbs and fat in whole percents that add up to 100 (largest remainder). */
export function energySplit(totals: Pick<NutritionTotals, "protein" | "carbs" | "fat">): EnergySplit {
  const kcal = { protein: totals.protein * KCAL_PER_G.protein, carbs: totals.carbs * KCAL_PER_G.carbohydrate, fat: totals.fat * KCAL_PER_G.fat };
  const sum = kcal.protein + kcal.carbs + kcal.fat;
  if (sum <= 0) return { protein: 0, carbs: 0, fat: 0 };
  const keys = ["protein", "carbs", "fat"] as const;
  const exact = keys.map((k) => ({ k, value: (kcal[k] / sum) * PERCENT }));
  const out = { protein: 0, carbs: 0, fat: 0 };
  for (const { k, value } of exact) out[k] = Math.floor(value);
  let missing = PERCENT - keys.reduce((s, k) => s + out[k], 0);
  for (const { k } of [...exact].sort((a, b) => (b.value % 1) - (a.value % 1))) {
    if (missing <= 0) break;
    out[k] += 1;
    missing -= 1;
  }
  return out;
}

const sumOf = (entries: Entry[], key: "calories" | "protein" | "carbs" | "fat"): number => entries.reduce((sum, e) => sum + e.nutrition[key], 0);

export function dayReport(entries: Entry[], targets: Targets, date: string): DayReport {
  const today = entries.filter((e) => e.date === date).sort((a, b) => a.at - b.at);
  const meals = MEAL_ORDER.map((meal) => {
    const own = today.filter((e) => e.meal === meal);
    return {
      meal,
      label: MEAL_LABELS[meal],
      calories: sumOf(own, "calories"),
      protein: sumOf(own, "protein"),
      carbs: sumOf(own, "carbs"),
      fat: sumOf(own, "fat"),
      at: own[0]?.at ?? 0,
      items: own.map((e) => ({ name: e.name, portion: e.portionText, calories: e.nutrition.calories, protein: e.nutrition.protein })),
    };
  }).filter((m) => m.items.length > 0);
  const totals = today.reduce((sum, e) => addTotals(sum, e.nutrition), ZERO_TOTALS);
  return { date, totals, targets, meals, itemCount: today.length, energySplit: energySplit(totals) };
}
