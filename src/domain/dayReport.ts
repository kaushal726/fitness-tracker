/* One day's food in the shape the shared picture needs: the totals, the targets, and each meal with what was in it. */
import type { Entry, Targets } from "../data/types.ts";
import { ZERO_TOTALS } from "../nutrition/constants.ts";
import { addTotals } from "../nutrition/math.ts";
import type { MealType, NutritionTotals } from "../nutrition/types.ts";
import { MEAL_LABELS, MEAL_ORDER } from "./meals.ts";

export interface DayReportItem {
  name: string;
  /** "2 roti", "200 g". */
  portion: string;
  calories: number;
}

export interface DayReportMeal {
  meal: MealType;
  label: string;
  calories: number;
  items: DayReportItem[];
}

export interface DayReport {
  date: string;
  totals: NutritionTotals;
  targets: Targets;
  /** Only the meals that have something logged, in the order of the day. */
  meals: DayReportMeal[];
  itemCount: number;
}

export function dayReport(entries: Entry[], targets: Targets, date: string): DayReport {
  const today = entries.filter((e) => e.date === date).sort((a, b) => a.at - b.at);
  const meals = MEAL_ORDER.map((meal) => {
    const own = today.filter((e) => e.meal === meal);
    return { meal, label: MEAL_LABELS[meal], calories: own.reduce((sum, e) => sum + e.nutrition.calories, 0), items: own.map((e) => ({ name: e.name, portion: e.portionText, calories: e.nutrition.calories })) };
  }).filter((m) => m.items.length > 0);
  return { date, totals: today.reduce((sum, e) => addTotals(sum, e.nutrition), ZERO_TOTALS), targets, meals, itemCount: today.length };
}
