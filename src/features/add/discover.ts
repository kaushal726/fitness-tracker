/* Foods to offer before anything is typed, from the whole food list and not only from what a person has logged:
 * the common ones for the meal, healthy ones, ones that close the day's protein gap, and a daily change of foods that are
 * eaten but not every day. Every choice is by a rule on the food's own data, so it is the same on a phone and in a test.
 */
import { defaultPortion, lastPortionSummary } from "../../domain/portions.ts";
import type { Entry, LastUsed } from "../../data/types.ts";
import type { Food, FoodType, MealType } from "../../nutrition/types.ts";

/** What one serving of a food for the meal may come to, for it to be a light choice. */
const LIGHT_KCAL: Record<MealType, number> = { breakfast: 450, lunch: 600, snack: 300, dinner: 550 };
/** A serving of a food for a protein gap has at least this much protein. */
const MIN_PROTEIN_G = 12;
/** A protein gap is worth a section from this many grams. */
export const PROTEIN_GAP_G = 15;
/** The smallest calorie room a protein suggestion is held to. */
const MIN_ROOM_KCAL = 150;
/** Enough days of logging to say what someone does not eat. */
const DIET_MIN_ENTRIES = 12;
/** Things that are ingredients, not something eaten as it is. */
const NOT_FOR_A_MEAL = new Set(["supplements", "packaged", "condiments", "staples", "nuts_seeds"]);
const NOT_FOR_A_MEAL_KINDS = new Set(["organ", "dried_fish", "water"]);
const RAW_OR_DRY = /\b(raw|dry|dried|powder|flour|sashimi)\b/i;
/** What a healthy or protein pick is drawn from: cooked dishes, not sweets, drinks or dairy by itself. */
const HEALTHY_CATEGORIES = new Set(["main_course", "breakfast", "snacks", "protein", "vegetables", "fruits"]);
const HEALTHY_TAGS = ["high_protein", "high_fiber", "low_calorie"];

/** A number from a text, the same every time: a day's choice of foods does not change when the page opens again. */
export function hashOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** The kinds of food this person has never logged, once there is enough logged to say: no meat, then no eggs either. */
export function leftOut(history: Entry[], lookup: (id: string) => Food | undefined): Set<FoodType> {
  const kinds = history.map((e) => lookup(e.foodId)?.foodType).filter((t): t is FoodType => t !== undefined);
  const out = new Set<FoodType>();
  if (kinds.length < DIET_MIN_ENTRIES) return out;
  if (!kinds.includes("non_vegetarian")) out.add("non_vegetarian");
  if (out.has("non_vegetarian") && !kinds.includes("eggetarian")) out.add("eggetarian");
  return out;
}

export interface Pick {
  food: Food;
  portion?: LastUsed;
}

export interface DiscoverInput {
  pool: readonly Food[];
  popular: readonly Food[];
  meal: MealType;
  /** Changes what is offered from day to day. */
  seed: string;
  /** Not offered: already in the meal, or already on the page. */
  skip: Set<string>;
  leftOut: Set<FoodType>;
  lastUsed: Record<string, LastUsed>;
  /** What the day still has room for, when it is known. */
  remaining?: { calories: number; protein: number };
}

const suits = (food: Food, { meal, skip, leftOut: out }: DiscoverInput): boolean =>
  !skip.has(food.id) && food.mealTypes.includes(meal) && !food.brand && !NOT_FOR_A_MEAL.has(food.category) && !NOT_FOR_A_MEAL_KINDS.has(food.subCategory) && food.subCategory !== "alcohol" && !RAW_OR_DRY.test(food.name) && !out.has(food.foodType);

/** One tap adds the food in the amount it was last had, or one serving. A food whose serving cannot be worded is left to the amount page. */
function pick(food: Food, lastUsed: Record<string, LastUsed>): Pick {
  const amount = defaultPortion(food, lastUsed[food.id]);
  return { food, portion: lastPortionSummary(food, amount) ? amount : undefined };
}

/** Foods people really eat for it: the commonly eaten ones, and the healthy versions of everyday dishes. Not every food in the list is one. */
const everyday = (input: DiscoverInput): ((f: Food) => boolean) => {
  const common = new Set(input.popular.map((f) => f.id));
  return (f) => common.has(f.id) || f.sourceFile.startsWith("healthy-");
};

const byHash = (seed: string) => (a: Food, b: Food): number => hashOf(`${seed}|${a.id}`) - hashOf(`${seed}|${b.id}`);

/** The commonly eaten foods for the meal, the commonest first. */
export function popularFor(input: DiscoverInput, count: number): Pick[] {
  return input.popular.filter((f) => suits(f, input)).slice(0, count).map((f) => pick(f, input.lastUsed));
}

/** Light foods that are high in protein or fibre, or low in calories: a different few each day. */
export function healthyFor(input: DiscoverInput, count: number): Pick[] {
  const limit = LIGHT_KCAL[input.meal];
  const eaten = everyday(input);
  return input.pool
    .filter((f) => eaten(f) && suits(f, input) && HEALTHY_CATEGORIES.has(f.category) && f.nutritionPerServing.calories <= limit && (f.subCategory === "healthy" || f.tags.some((t) => HEALTHY_TAGS.includes(t))))
    .sort(byHash(`${input.seed}|healthy`))
    .slice(0, count)
    .map((f) => pick(f, input.lastUsed));
}

/** Foods that close the day's protein gap and fit the room left, the most protein for the calories first. Nothing when there is no gap. */
export function proteinFor(input: DiscoverInput, count: number): Pick[] {
  const { remaining } = input;
  if (!remaining || remaining.protein < PROTEIN_GAP_G) return [];
  const room = Math.max(MIN_ROOM_KCAL, remaining.calories);
  const eaten = everyday(input);
  const density = (f: Food): number => f.nutritionPerServing.protein / Math.max(1, f.nutritionPerServing.calories);
  return input.pool
    .filter((f) => eaten(f) && suits(f, input) && HEALTHY_CATEGORIES.has(f.category) && f.nutritionPerServing.protein >= MIN_PROTEIN_G && f.nutritionPerServing.calories <= room)
    .sort((a, b) => density(b) - density(a) || byHash(`${input.seed}|protein`)(a, b))
    .slice(0, count)
    .map((f) => pick(f, input.lastUsed));
}

/** Foods that are commonly eaten, but past the first few: a different few each day, so the list is never the same twice. */
export function differentFor(input: DiscoverInput, count: number, after: number): Pick[] {
  return input.popular
    .slice(after)
    .filter((f) => suits(f, input) && f.category !== "dairy")
    .sort(byHash(`${input.seed}|different`))
    .slice(0, count)
    .map((f) => pick(f, input.lastUsed));
}

/** Sabzi: vegetable dishes, paneer dishes and koftas. */
const SABZI_KINDS = new Set(["vegetable_curry", "paneer", "kofta"]);
export const isSabzi = (f: Food): boolean => f.category === "main_course" && SABZI_KINDS.has(f.subCategory);
/** The meals a sabzi belongs to. */
export const SABZI_MEALS: readonly MealType[] = ["lunch", "dinner"];
/** A version of a dish ("No Oil", "Restaurant Style"): the plain dish is the one to suggest. */
const VERSION = /\((no oil|light|air fried|restaurant style|low oil)/i;

/** Other sabzis of the kinds this person eats (their cuisines), the commonly eaten ones first, a different few each day. */
export function moreSabziFor(input: DiscoverInput, count: number, cuisines: ReadonlySet<string>): Pick[] {
  const rank = new Map(input.popular.map((f, i) => [f.id, i]));
  const order = byHash(`${input.seed}|sabzi`);
  return input.pool
    .filter((f) => isSabzi(f) && f.type === "simple" && suits(f, input) && !VERSION.test(f.name) && (cuisines.size === 0 || cuisines.has(f.cuisine)))
    .sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity) || order(a, b))
    .slice(0, count)
    .map((f) => pick(f, input.lastUsed));
}
