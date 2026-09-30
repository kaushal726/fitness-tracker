import type { MealType, Nutrition, NutritionTotals } from "./types.ts";

/** Rounding used for anything shown to a user. Data is stored rounded already; sums are rounded here. */
export const CALORIE_DECIMALS = 0;
export const MACRO_DECIMALS = 1;
export const SODIUM_DECIMALS = 0;

export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "snack", "dinner"];

export const ZERO_TOTALS: NutritionTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 };

/** Energy per gram, used only for the data sanity check. */
export const KCAL_PER_G = { protein: 4, carbohydrate: 4, fat: 9, fiberDiscounted: 2 } as const;

/** Alcoholic drinks get most of their energy from ethanol, which is not a tracked macro, so the macro-based calorie check skips them. */
export const ALCOHOL_SUB_CATEGORY = "alcohol";

/** Tags derived from the numbers. Per 100 g. These are filters, not health claims. */
export const AUTO_TAG_RULES: { tag: string; test: (n: Nutrition) => boolean }[] = [
  { tag: "high_protein", test: (n) => n.protein >= 15 },
  { tag: "high_fiber", test: (n) => n.fiber >= 6 },
  { tag: "low_calorie", test: (n) => n.calories <= 60 },
  { tag: "high_calorie", test: (n) => n.calories >= 400 },
  { tag: "low_fat", test: (n) => n.fat <= 3 },
  { tag: "high_fat", test: (n) => n.fat >= 20 },
  { tag: "low_carb", test: (n) => n.carbohydrates <= 5 },
  { tag: "high_carb", test: (n) => n.carbohydrates >= 50 },
  { tag: "sugar_free", test: (n) => n.sugar === 0 },
];

export const DEFAULT_DENSITY_G_PER_ML = 1;
