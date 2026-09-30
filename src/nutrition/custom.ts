/* A user-made food: "1 serving" holds exactly the numbers they typed. Built as a normal Food so
 * search and the calculator treat it like any other; only the storage differs.
 */
import { buildSearchableText } from "./loader.ts";
import type { Food, Nutrition } from "./types.ts";

export const CUSTOM_CATEGORY = "custom";
export const CUSTOM_ID_PREFIX = "custom_";
/** A custom serving is stored as this many grams, so per-100 g values equal the serving's values. */
const SERVING_GRAMS = 100;

export interface CustomFoodInput {
  id: string;
  name: string;
  /** Wording for one serving, e.g. "1 bowl". */
  servingLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export function createCustomFood(input: CustomFoodInput): Food {
  const nutrition: Nutrition = {
    calories: input.calories,
    protein: input.protein,
    carbohydrates: input.carbs,
    fat: input.fat,
    fiber: input.fiber,
    sugar: 0,
    sodium: 0,
  };
  const food: Food = {
    id: input.id,
    name: input.name,
    aliases: [],
    category: CUSTOM_CATEGORY,
    subCategory: CUSTOM_CATEGORY,
    cuisine: CUSTOM_CATEGORY,
    foodType: "vegetarian",
    type: "simple",
    servingOptions: [{ label: input.servingLabel, unit: "serving", grams: SERVING_GRAMS }],
    nutritionPer100g: nutrition,
    nutritionPerServing: nutrition,
    densityGPerMl: 1,
    tags: [],
    mealTypes: ["breakfast", "lunch", "snack", "dinner"],
    nutritionConfidence: "medium",
    dataSourceType: "estimated",
    variability: "low",
    searchableText: "",
    sourceFile: CUSTOM_CATEGORY,
  };
  food.searchableText = buildSearchableText(food);
  return food;
}
