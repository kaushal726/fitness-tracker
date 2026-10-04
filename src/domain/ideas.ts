/* Foods to suggest when a day is going off course: short of protein or fibre late in the day, or over its calories.
 *
 * Suggestions come from the commonly eaten foods only, so a person is pointed at things they would really eat, and one
 * pick per kind of food so the list is a choice, not four versions of the same thing.
 */
import type { Targets } from "../data/types.ts";
import type { Food, NutritionTotals } from "../nutrition/types.ts";
import { LOW_PROTEIN_SHARE, OVER_SHARE, PROTEIN_CHECK_HOUR } from "./insights.ts";

const LOW_FIBER_SHARE = 0.6;
const MAX_GROUPS = 2;
const IDEAS_PER_GROUP = 4;
const MAX_NON_VEG = 2;
/** The calories a suggestion may bring when the day has little or no room left. */
const MIN_ROOM_KCAL = 150;
/** Least a food must add to be worth suggesting for a nutrient, in grams per serving. */
const MIN_USEFUL_G = { protein: 5, fiber: 2.5 } as const;
/** A "light" food for a day that is over: small, and still worth eating. */
const LIGHT_MAX_KCAL = 120;
const LIGHT_MIN_G = 2;
const POPULARITY_WEIGHT = 10;
const COVERAGE_WEIGHT = 40;
const DENSITY_WEIGHT = 2;
const DENSITY_CAP = 20;
/** A suggestion may use up to this share of what the day has left. */
const ROOM_SHARE = 0.6;
/** Raw ingredients and powders are not something to be told to eat. */
const NOT_A_MEAL = /\b(raw|powder|flour|dry|dried)\b/i;
const EXCLUDED_CATEGORIES = new Set(["condiments", "staples", "supplements"]);
const LIGHT_CATEGORIES = new Set(["fruits", "vegetables", "dairy", "protein", "drinks"]);
/** Of the vegetables only these are eaten as they are listed: a raw brinjal or a karela is an ingredient. */
const READY_VEGETABLES = new Set(["salad", "boiled"]);
/** Words that only say how a food was cooked, so "Boiled Chicken Breast" and "Chicken Breast" are one kind. */
const COOKING_WORDS = new Set(["boiled", "grilled", "fried", "roasted", "steamed", "baked", "cooked", "plain", "fresh", "mixed", "sweet", "green"]);

export type GapNutrient = "protein" | "fiber" | "calories";

export interface DayGap {
  nutrient: GapNutrient;
  kind: "short" | "over";
  /** Grams for protein and fibre, kcal for calories. */
  amount: number;
  /** What has been eaten and what the goal is, in the same unit, so the gap can be drawn. */
  eaten: number;
  goal: number;
}

export interface Idea {
  food: Food;
  /** Calories in its first serving. */
  calories: number;
  /** Grams of the missing nutrient in that serving; 0 for the light options of an over day. */
  adds: number;
  vegetarian: boolean;
}

export interface DayIdeas {
  gap: DayGap;
  foods: Idea[];
}

/** What is off about the day, most pressing first. Uses the same lines as the one-sentence insight on Today. */
export function dayGaps(totals: NutritionTotals, targets: Targets, hour: number): DayGap[] {
  const gaps: DayGap[] = [];
  if (totals.calories > targets.calories * OVER_SHARE) gaps.push({ nutrient: "calories", kind: "over", amount: totals.calories - targets.calories, eaten: totals.calories, goal: targets.calories });
  if (hour >= PROTEIN_CHECK_HOUR && totals.protein < targets.protein * LOW_PROTEIN_SHARE) gaps.push({ nutrient: "protein", kind: "short", amount: targets.protein - totals.protein, eaten: totals.protein, goal: targets.protein });
  if (hour >= PROTEIN_CHECK_HOUR && totals.fiber < targets.fiber * LOW_FIBER_SHARE) gaps.push({ nutrient: "fiber", kind: "short", amount: targets.fiber - totals.fiber, eaten: totals.fiber, goal: targets.fiber });
  return gaps;
}

const isVegetarian = (f: Food): boolean => f.foodType !== "non_vegetarian";

/** What kind of food it is, for offering one of each: its first word that is not about cooking. */
function kindOf(f: Food): string {
  const words = f.name.toLowerCase().replace(/\(.*?\)/g, "").split(/\s+/).filter(Boolean);
  return words.find((w) => !COOKING_WORDS.has(w)) ?? words[0] ?? f.id;
}

const eligible = (f: Food): boolean =>
  !EXCLUDED_CATEGORIES.has(f.category)
  && f.subCategory !== "alcohol"
  && !NOT_A_MEAL.test(f.name)
  && (f.category !== "vegetables" || READY_VEGETABLES.has(f.subCategory));

/** Picks the best-scoring foods, one per kind of food, and at most a couple that are not vegetarian. */
function pickBest(scored: { food: Food; score: number; adds: number }[]): Idea[] {
  const picked: Idea[] = [];
  const kinds = new Set<string>();
  let nonVeg = 0;
  for (const { food, adds } of [...scored].sort((a, b) => b.score - a.score)) {
    if (picked.length === IDEAS_PER_GROUP) break;
    if (kinds.has(kindOf(food)) || (!isVegetarian(food) && nonVeg >= MAX_NON_VEG)) continue;
    kinds.add(kindOf(food));
    if (!isVegetarian(food)) nonVeg += 1;
    picked.push({ food, calories: food.nutritionPerServing.calories, adds, vegetarian: isVegetarian(food) });
  }
  return picked;
}

function forShortfall(pool: Food[], gap: DayGap, room: number): Idea[] {
  const nutrient = gap.nutrient === "fiber" ? "fiber" : "protein";
  const budget = Math.max(room * ROOM_SHARE, MIN_ROOM_KCAL);
  const scored = pool.flatMap((food, index) => {
    const serving = food.nutritionPerServing;
    const adds = serving[nutrient];
    if (adds < MIN_USEFUL_G[nutrient] || serving.calories > budget) return [];
    const density = (adds / Math.max(serving.calories, 1)) * 100;
    const score = (Math.min(adds, gap.amount) / gap.amount) * COVERAGE_WEIGHT + Math.min(density, DENSITY_CAP) * DENSITY_WEIGHT + (1 - index / pool.length) * POPULARITY_WEIGHT;
    return [{ food, score, adds }];
  });
  return pickBest(scored);
}

function lightOptions(pool: Food[]): Idea[] {
  const scored = pool.flatMap((food, index) => {
    const serving = food.nutritionPerServing;
    const worth = serving.protein + serving.fiber;
    if (!LIGHT_CATEGORIES.has(food.category) || serving.calories > LIGHT_MAX_KCAL || worth < LIGHT_MIN_G) return [];
    return [{ food, score: (worth / Math.max(serving.calories, 1)) * 100 + (1 - index / pool.length) * POPULARITY_WEIGHT, adds: 0 }];
  });
  return pickBest(scored);
}

/** Foods that would put the day right, for the one or two things most off. `pool` is the commonly eaten foods, most common first. */
export function dayIdeas(totals: NutritionTotals, targets: Targets, hour: number, pool: Food[]): DayIdeas[] {
  const usable = pool.filter(eligible);
  const room = targets.calories - totals.calories;
  return dayGaps(totals, targets, hour)
    .slice(0, MAX_GROUPS)
    .map((gap) => ({ gap, foods: gap.kind === "over" ? lightOptions(usable) : forShortfall(usable, gap, room) }))
    .filter((group) => group.foods.length > 0);
}
