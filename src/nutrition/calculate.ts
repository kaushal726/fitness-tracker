import { MEAL_TYPES } from "./constants.ts";
import { roundTotals, scaleTotals, subtractTotals, sumTotals } from "./math.ts";
import { getFoodById } from "./registry.ts";
import { gramsFor, resolveUnitId } from "./units.ts";
import type { CalculatedItem, Food, DailyNutrition, FoodQuantity, MealInput, MealNutrition, MealType, NutritionTotals } from "./types.ts";

export type CalcErrorCode = "unknown_food" | "unknown_unit" | "unsupported_unit" | "invalid_quantity";

export class FoodCalcError extends Error {
  code: CalcErrorCode;
  constructor(code: CalcErrorCode, message: string) {
    super(message);
    this.name = "FoodCalcError";
    this.code = code;
  }
}

/** Grams for `quantity` of `unit` of a food. Throws FoodCalcError when it cannot be sized. Works for any Food, built-in or custom. */
export function foodToGrams(food: Food, quantity: number, unit: string): number {
  if (!Number.isFinite(quantity) || quantity < 0) throw new FoodCalcError("invalid_quantity", `Invalid quantity: ${quantity}`);
  if (!resolveUnitId(unit)) throw new FoodCalcError("unknown_unit", `Unknown unit: ${unit}`);
  const grams = gramsFor(food, quantity, unit);
  if (grams === null) throw new FoodCalcError("unsupported_unit", `${food.name} has no "${unit}" serving`);
  return grams;
}

/** Nutrition of `quantity` x `unit` of a food object, rounded for display. */
export function nutritionForFood(food: Food, quantity: number, unit: string): NutritionTotals {
  return roundTotals(scaleTotals(food.nutritionPer100g, foodToGrams(food, quantity, unit)));
}

export function toGrams(foodId: string, quantity: number, unit: string): number {
  return foodToGrams(requireFood(foodId), quantity, unit);
}

function requireFood(foodId: string) {
  const food = getFoodById(foodId);
  if (!food) throw new FoodCalcError("unknown_food", `Unknown food: ${foodId}`);
  return food;
}

/** One item, unrounded, so callers can sum first and round once. */
function scaleItem(item: FoodQuantity): { grams: number; raw: NutritionTotals } {
  const grams = toGrams(item.foodId, item.quantity, item.unit);
  return { grams, raw: scaleTotals(requireFood(item.foodId).nutritionPer100g, grams) };
}

/** Nutrition of `quantity` x `unit` of one food, e.g. calculateNutrition("plain_dosa", 2, "piece"). */
export function calculateNutrition(foodId: string, quantity: number, unit: string): NutritionTotals {
  return roundTotals(scaleItem({ foodId, quantity, unit }).raw);
}

/** Sums unrounded values and rounds once, so a meal never drifts from its parts by rounding. */
export function calculateMealNutrition(items: FoodQuantity[]): MealNutrition {
  const scaled = items.map(scaleItem);
  const calculated: CalculatedItem[] = items.map((item, i) => ({ ...item, grams: scaled[i].grams, nutrition: roundTotals(scaled[i].raw) }));
  return { items: calculated, totals: roundTotals(sumTotals(scaled.map((s) => s.raw))) };
}

export function calculateDailyNutrition(meals: MealInput[], targets?: NutritionTotals): DailyNutrition {
  const byMeal = Object.fromEntries(
    MEAL_TYPES.map((m) => [m, calculateMealNutrition(meals.filter((x) => x.mealType === m).flatMap((x) => x.items))]),
  ) as Record<MealType, MealNutrition>;
  const totals = roundTotals(sumTotals(MEAL_TYPES.map((m) => byMeal[m].totals)));
  return { meals: byMeal, totals, remaining: targets ? roundTotals(subtractTotals(targets, totals)) : undefined };
}
