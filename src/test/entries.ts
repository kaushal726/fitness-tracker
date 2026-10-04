import type { Entry } from "../data/types.ts";
import type { MealType } from "../nutrition/types.ts";

let counter = 0;

/** A logged entry with the given calories, for tests that only care about the totals. */
export function entry(date: string, calories: number, extra: Partial<Entry> & { protein?: number; carbs?: number; fat?: number; fiber?: number } = {}): Entry {
  counter += 1;
  const { protein = calories * 0.04, carbs = calories * 0.1, fat = calories * 0.03, fiber = calories * 0.005, ...rest } = extra;
  return {
    id: `e${counter}`,
    date,
    at: new Date(`${date}T12:00:00`).getTime() + counter,
    meal: "lunch" as MealType,
    foodId: "roti",
    name: "Roti",
    quantity: 1,
    unit: "roti",
    portionText: "1 roti",
    grams: 40,
    nutrition: { calories, protein, carbs, fat, fiber, sugar: 0, sodium: 0 },
    ...rest,
  };
}
