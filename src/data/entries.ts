import { mealForTime } from "../domain/meals.ts";
import { portionText } from "../domain/portions.ts";
import { toISODate } from "../lib/dates.ts";
import { uid } from "../lib/ids.ts";
import { foodToGrams, nutritionForFood } from "../nutrition/calculate.ts";
import type { Food, MealType } from "../nutrition/types.ts";
import type { Entry, Settings } from "./types.ts";

interface BuildEntryInput {
  food: Food;
  quantity: number;
  unit: string;
  /** Null means "work it out from the time". */
  meal: MealType | null;
  /** The day being logged. Defaults to today. */
  date?: string;
  settings: Settings;
  now?: Date;
}

/** A log entry with its nutrition frozen at the moment it was saved. */
export function buildEntry({ food, quantity, unit, meal, date, settings, now = new Date() }: BuildEntryInput): Entry {
  return {
    id: uid(),
    date: date ?? toISODate(now),
    at: now.getTime(),
    meal: meal ?? mealForTime(now, settings.mealStartHours),
    foodId: food.id,
    name: food.name,
    quantity,
    unit,
    portionText: portionText(food, quantity, unit),
    grams: Math.round(foodToGrams(food, quantity, unit)),
    nutrition: nutritionForFood(food, quantity, unit),
  };
}

/** The same entry with a new portion and/or meal; keeps its id and time. */
export function reviseEntry(entry: Entry, food: Food, quantity: number, unit: string, meal: MealType): Entry {
  return {
    ...entry,
    meal,
    quantity,
    unit,
    portionText: portionText(food, quantity, unit),
    grams: Math.round(foodToGrams(food, quantity, unit)),
    nutrition: nutritionForFood(food, quantity, unit),
  };
}
