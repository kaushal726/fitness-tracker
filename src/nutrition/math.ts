import { CALORIE_DECIMALS, MACRO_DECIMALS, SODIUM_DECIMALS, ZERO_TOTALS } from "./constants.ts";
import type { Nutrition, NutritionTotals } from "./types.ts";

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function toTotals(n: Nutrition): NutritionTotals {
  return { calories: n.calories, protein: n.protein, carbs: n.carbohydrates, fat: n.fat, fiber: n.fiber, sugar: n.sugar, sodium: n.sodium };
}

export function roundTotals(t: NutritionTotals): NutritionTotals {
  return {
    calories: roundTo(t.calories, CALORIE_DECIMALS),
    protein: roundTo(t.protein, MACRO_DECIMALS),
    carbs: roundTo(t.carbs, MACRO_DECIMALS),
    fat: roundTo(t.fat, MACRO_DECIMALS),
    fiber: roundTo(t.fiber, MACRO_DECIMALS),
    sugar: roundTo(t.sugar, MACRO_DECIMALS),
    sodium: roundTo(t.sodium, SODIUM_DECIMALS),
  };
}

/** Nutrition of `grams` of a food whose values are per 100 g. Unrounded. */
export function scaleTotals(per100g: Nutrition, grams: number): NutritionTotals {
  const factor = grams / 100;
  const t = toTotals(per100g);
  return {
    calories: t.calories * factor, protein: t.protein * factor, carbs: t.carbs * factor, fat: t.fat * factor,
    fiber: t.fiber * factor, sugar: t.sugar * factor, sodium: t.sodium * factor,
  };
}

export function addTotals(a: NutritionTotals, b: NutritionTotals): NutritionTotals {
  return {
    calories: a.calories + b.calories, protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat,
    fiber: a.fiber + b.fiber, sugar: a.sugar + b.sugar, sodium: a.sodium + b.sodium,
  };
}

export function subtractTotals(a: NutritionTotals, b: NutritionTotals): NutritionTotals {
  return {
    calories: a.calories - b.calories, protein: a.protein - b.protein, carbs: a.carbs - b.carbs, fat: a.fat - b.fat,
    fiber: a.fiber - b.fiber, sugar: a.sugar - b.sugar, sodium: a.sodium - b.sodium,
  };
}

export function sumTotals(list: NutritionTotals[]): NutritionTotals {
  return list.reduce(addTotals, ZERO_TOTALS);
}

/** The mean of several totals, or null when there are none. */
export function averageTotals(list: NutritionTotals[]): NutritionTotals | null {
  if (list.length === 0) return null;
  const sum = sumTotals(list);
  const n = list.length;
  return { calories: sum.calories / n, protein: sum.protein / n, carbs: sum.carbs / n, fat: sum.fat / n, fiber: sum.fiber / n, sugar: sum.sugar / n, sodium: sum.sodium / n };
}

/** Back from totals to the stored shape, rounded the way the data files are. */
export function fromTotals(t: NutritionTotals): Nutrition {
  const r = roundTotals(t);
  return { calories: r.calories, protein: r.protein, carbohydrates: r.carbs, fat: r.fat, fiber: r.fiber, sugar: r.sugar, sodium: r.sodium };
}
