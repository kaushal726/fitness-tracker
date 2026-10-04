/* What the calories were made of, cut by what kind of food it was: the category, the cuisine, vegetarian or not, and how
 * much of it was treats and packaged food. Needs the food data, so it takes a lookup; a food that is gone from the data
 * (or not loaded yet) counts as "Other" rather than vanishing from the total.
 */
import type { Entry } from "../data/types.ts";
import type { FoodLookup } from "../data/selectors.ts";
import { categoryLabel } from "../nutrition/categories.ts";
import type { Food } from "../nutrition/types.ts";

export interface MixRow {
  key: string;
  label: string;
  calories: number;
  /** Of all the calories in the mix, 0 to 1. */
  share: number;
}

export const OTHER_KEY = "other";

const TREAT_CATEGORIES: ReadonlySet<string> = new Set(["sweets", "desserts", "fast_food", "bakery", "packaged"]);
const TREAT_DRINKS: ReadonlySet<string> = new Set(["soft_drink", "energy_sports", "alcohol", "mocktail"]);
const TREAT_SNACKS: ReadonlySet<string> = new Set(["fried", "namkeen", "packaged"]);

/** Sweets, desserts, fast food, bakery, packaged food, fizzy and alcoholic drinks, and fried or packaged snacks. */
export function isTreat(food: Food): boolean {
  return TREAT_CATEGORIES.has(food.category) || (food.category === "drinks" && TREAT_DRINKS.has(food.subCategory)) || (food.category === "snacks" && TREAT_SNACKS.has(food.subCategory));
}

/** Rows biggest first, "Other" last whatever its size. */
export function calorieMix(entries: Entry[], lookup: FoodLookup, keyOf: (food: Food) => string, labelOf: (key: string) => string): MixRow[] {
  const totals = new Map<string, number>();
  for (const e of entries) {
    const food = lookup(e.foodId);
    const key = food ? keyOf(food) : OTHER_KEY;
    totals.set(key, (totals.get(key) ?? 0) + e.nutrition.calories);
  }
  const sum = [...totals.values()].reduce((a, b) => a + b, 0);
  if (sum <= 0) return [];
  return [...totals]
    .map(([key, calories]) => ({ key, label: key === OTHER_KEY ? "Other" : labelOf(key), calories, share: calories / sum }))
    .sort((a, b) => (a.key === OTHER_KEY ? 1 : b.key === OTHER_KEY ? -1 : b.calories - a.calories || a.label.localeCompare(b.label)));
}

export const mixByCategory = (entries: Entry[], lookup: FoodLookup): MixRow[] => calorieMix(entries, lookup, (f) => f.category, categoryLabel);

const CUISINE_LABELS: Record<string, string> = {
  pan_indian: "Everyday Indian",
  bihari_jharkhand: "Bihari",
  andhra_telangana: "Andhra and Telangana",
  japanese_korean: "Japanese and Korean",
  nepali_tibetan: "Nepali and Tibetan",
  indo_chinese: "Indo-Chinese",
  middle_eastern: "Middle Eastern",
  anglo_indian: "Anglo-Indian",
  eastern_european: "Eastern European",
  southeast_asian: "Southeast Asian",
  latin_american: "Latin American",
  sri_lankan: "Sri Lankan",
  custom: "Your own foods",
};

/** "north_indian" -> "North Indian"; a few get a nicer name. */
export function cuisineLabel(id: string): string {
  return CUISINE_LABELS[id] ?? id.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export const mixByCuisine = (entries: Entry[], lookup: FoodLookup): MixRow[] => calorieMix(entries, lookup, (f) => f.cuisine, cuisineLabel);

const DIET_LABELS: Record<string, string> = { plant: "Vegetarian and vegan", egg: "Egg", meat: "Meat and fish" };

/** Plants (vegetarian and vegan), eggs, and meat or fish. */
export const mixByDiet = (entries: Entry[], lookup: FoodLookup): MixRow[] =>
  calorieMix(entries, lookup, (f) => (f.foodType === "non_vegetarian" ? "meat" : f.foodType === "eggetarian" ? "egg" : "plant"), (key) => DIET_LABELS[key] ?? key);

/** How much of the calories were treats, 0 to 1; null when nothing known was eaten. */
export function treatShare(entries: Entry[], lookup: FoodLookup): number | null {
  let treats = 0;
  let known = 0;
  for (const e of entries) {
    const food = lookup(e.foodId);
    if (!food) continue;
    known += e.nutrition.calories;
    if (isTreat(food)) treats += e.nutrition.calories;
  }
  return known > 0 ? treats / known : null;
}
