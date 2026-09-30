/* Turns the raw JSON files into ready-to-use foods: file defaults applied, servings sized,
 * derived tags and search text filled, composite foods computed from their ingredients.
 */
import { AUTO_TAG_RULES } from "./constants.ts";
import { fromTotals, scaleTotals, sumTotals } from "./math.ts";
import { normalizeText } from "./text.ts";
import { gramsFor } from "./units.ts";
import type { CompositeIngredient, Food, FoodType, MealType, Nutrition, RawFile, RawFood, ServingOption } from "./types.ts";
import categoriesJson from "../../data/categories.json" with { type: "json" };

/** Meals a food is offered for when it does not say. Only a hint: the dataset never forces a meal. */
const DEFAULT_MEALS: Record<string, MealType[]> = {
  breakfast: ["breakfast", "snack"],
  main_course: ["lunch", "dinner"],
  snacks: ["snack"],
  fruits: ["breakfast", "snack"],
  vegetables: ["lunch", "dinner"],
  dairy: ["breakfast", "snack", "lunch", "dinner"],
  protein: ["breakfast", "lunch", "snack", "dinner"],
  drinks: ["breakfast", "lunch", "snack", "dinner"],
  sweets: ["snack", "dinner"],
  desserts: ["snack", "dinner"],
  fast_food: ["lunch", "snack", "dinner"],
  chinese: ["lunch", "dinner", "snack"],
  bakery: ["breakfast", "snack"],
  nuts_seeds: ["breakfast", "snack"],
  condiments: ["breakfast", "lunch", "snack", "dinner"],
  supplements: ["breakfast", "snack"],
  packaged: ["breakfast", "snack"],
  staples: ["lunch", "dinner"],
};
const ALL_MEALS: MealType[] = ["breakfast", "lunch", "snack", "dinner"];
const FALLBACK_FOOD_TYPE: FoodType = "vegetarian";
const FALLBACK_CATEGORY = "snacks";
const FALLBACK_CUISINE = "pan_indian";

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(categoriesJson.categories).map(([id, c]) => [id, c.label]),
);

export function isComposite(raw: RawFood): boolean {
  return raw.type === "composite";
}

function mergeTags(...lists: (string[] | undefined)[]): string[] {
  return [...new Set(lists.flatMap((l) => l ?? []))];
}

function foodTypeTag(type: FoodType): string[] {
  if (type === "vegan") return ["vegan", "vegetarian"];
  if (type === "non_vegetarian") return ["non_vegetarian"];
  return type === "eggetarian" ? ["vegetarian", "contains_egg"] : ["vegetarian"];
}

export function buildSearchableText(food: Pick<Food, "name" | "aliases" | "category" | "subCategory" | "cuisine" | "tags">): string {
  return normalizeText([food.name, ...food.aliases, CATEGORY_LABELS[food.category] ?? food.category, food.subCategory, food.cuisine, ...food.tags].join(" "));
}

function withGrams(options: RawFood["servingOptions"], fallbackGrams: number | undefined): ServingOption[] {
  return options.map((o) => ({ label: o.label, unit: o.unit, grams: o.grams ?? fallbackGrams ?? 0 }));
}

function finish(raw: RawFood, file: RawFile, sourceFile: string, per100g: Nutrition, foodType: FoodType, servings: ServingOption[]): Food {
  const d = file.defaults;
  const category = raw.category ?? d.category ?? FALLBACK_CATEGORY;
  const tags = mergeTags(d.tags, raw.tags, foodTypeTag(foodType), AUTO_TAG_RULES.filter((r) => r.test(per100g)).map((r) => r.tag));
  const defaultGrams = servings[0]?.grams ?? 0;
  const food: Food = {
    id: raw.id,
    name: raw.name,
    aliases: raw.aliases ?? [],
    category,
    subCategory: raw.subCategory,
    cuisine: raw.cuisine ?? d.cuisine ?? FALLBACK_CUISINE,
    foodType,
    type: isComposite(raw) ? "composite" : "simple",
    servingOptions: servings,
    nutritionPer100g: per100g,
    nutritionPerServing: fromTotals(scaleTotals(per100g, defaultGrams)),
    densityGPerMl: raw.densityGPerMl ?? 1,
    preparationMethod: raw.preparationMethod,
    ingredients: raw.ingredients,
    tags,
    mealTypes: raw.mealTypes ?? d.mealTypes ?? DEFAULT_MEALS[category] ?? ALL_MEALS,
    nutritionConfidence: raw.nutritionConfidence ?? d.nutritionConfidence ?? "medium",
    dataSourceType: raw.dataSourceType ?? d.dataSourceType ?? "estimated",
    variability: raw.variability ?? d.variability ?? "low",
    estimateRange: raw.estimateRange,
    brand: raw.brand,
    searchableText: "",
    sourceFile,
  };
  food.searchableText = buildSearchableText(food);
  return food;
}

export function hydrateSimple(raw: RawFood, file: RawFile, sourceFile: string): Food {
  const foodType = raw.foodType ?? file.defaults.foodType ?? FALLBACK_FOOD_TYPE;
  return finish(raw, file, sourceFile, raw.nutritionPer100g as Nutrition, foodType, withGrams(raw.servingOptions, undefined));
}

const MEAT_RANK: Record<FoodType, number> = { vegan: 0, vegetarian: 1, eggetarian: 2, non_vegetarian: 3 };

/** A composite food's nutrition is the sum of its ingredients, expressed per 100 g of the finished dish. */
export function hydrateComposite(raw: RawFood, file: RawFile, sourceFile: string, lookup: (id: string) => Food | undefined): Food {
  const parts = (raw.ingredients ?? []) as CompositeIngredient[];
  const scaled = parts.map((p) => {
    const food = lookup(p.foodId);
    const grams = food ? gramsFor(food, p.quantity, p.unit) : null;
    if (!food || grams === null) throw new Error(`${raw.id}: cannot resolve ingredient ${p.foodId} (${p.quantity} ${p.unit})`);
    return { food, grams, totals: scaleTotals(food.nutritionPer100g, grams) };
  });
  const totalGrams = scaled.reduce((sum, s) => sum + s.grams, 0);
  const sum = sumTotals(scaled.map((s) => s.totals));
  const per100g = fromTotals(scaleTotals(totalsAsNutrition(sum), 10000 / totalGrams));
  const foodType = scaled.reduce<FoodType>((worst, s) => (MEAT_RANK[s.food.foodType] > MEAT_RANK[worst] ? s.food.foodType : worst), "vegan");
  return finish(raw, file, sourceFile, per100g, foodType, withGrams(raw.servingOptions, Math.round(totalGrams)));
}

function totalsAsNutrition(t: ReturnType<typeof sumTotals>): Nutrition {
  return { calories: t.calories, protein: t.protein, carbohydrates: t.carbs, fat: t.fat, fiber: t.fiber, sugar: t.sugar, sodium: t.sodium };
}
