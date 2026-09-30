/* Data quality checks. Errors mean the data is wrong or unusable; warnings mean "look at this".
 * The calorie check is deliberately loose: fibre, rounding and water content make real foods
 * differ from 4/4/9, so only large gaps are flagged.
 */
import categoriesJson from "../../data/categories.json" with { type: "json" };
import popular from "../../data/popular-foods.json" with { type: "json" };
import { ALCOHOL_SUB_CATEGORY, KCAL_PER_G } from "./constants.ts";
import { DATA_FILES } from "./dataFiles.ts";
import { isComposite } from "./loader.ts";
import { foodsLoaded, getAllFoods, getFoodById, setDataFiles } from "./registry.ts";
import { normalizeText } from "./text.ts";
import { baseUnitId, resolveUnitId } from "./units.ts";
import type { CompositeIngredient, Nutrition, RawFood } from "./types.ts";

export interface Issue {
  level: "error" | "warning";
  id: string;
  file: string;
  message: string;
}

const LIMITS = {
  maxCaloriesPer100g: 900,
  maxSodiumPer100gMg: 6000,
  maxServingGrams: 3000,
  /** Sum of macros can exceed 100 g slightly through rounding. */
  macroSumSlackG: 3,
  calorieWarnRatio: 0.25,
  calorieWarnKcal: 30,
  calorieErrorRatio: 0.5,
  calorieErrorKcal: 60,
  tinyCalories: 20,
  tinyCalorieSlack: 20,
  maxSugarOverCarbG: 0.5,
} as const;

const NON_VEGAN_TAGS = ["contains_dairy", "contains_egg", "non_vegetarian"];
const NUTRIENT_KEYS: (keyof Nutrition)[] = ["calories", "protein", "carbohydrates", "fat", "fiber", "sugar", "sodium"];
const RANGE_KEYS = ["calories", "protein", "carbohydrates", "fat"] as const;

export function atwaterCalories(n: Nutrition): number {
  const digestibleCarbs = Math.max(0, n.carbohydrates - n.fiber);
  return n.protein * KCAL_PER_G.protein + digestibleCarbs * KCAL_PER_G.carbohydrate + n.fiber * KCAL_PER_G.fiberDiscounted + n.fat * KCAL_PER_G.fat;
}

function checkNutrition(n: Nutrition | undefined, push: (level: Issue["level"], message: string) => void, isAlcohol = false): void {
  if (!n) return push("error", "missing nutritionPer100g");
  for (const key of NUTRIENT_KEYS) {
    const v = n[key];
    if (typeof v !== "number" || Number.isNaN(v)) push("error", `nutrition.${key} is missing or not a number`);
    else if (v < 0) push("error", `nutrition.${key} is negative (${v})`);
  }
  if (NUTRIENT_KEYS.some((k) => typeof n[k] !== "number" || n[k] < 0)) return;

  if (n.calories > LIMITS.maxCaloriesPer100g) push("error", `calories ${n.calories}/100g is above ${LIMITS.maxCaloriesPer100g}`);
  if (n.sodium > LIMITS.maxSodiumPer100gMg) push("warning", `sodium ${n.sodium} mg/100g looks very high`);
  if (n.protein + n.carbohydrates + n.fat > 100 + LIMITS.macroSumSlackG) push("error", `protein+carbs+fat = ${(n.protein + n.carbohydrates + n.fat).toFixed(1)} g in 100 g`);
  if (n.fiber > n.carbohydrates + 0.5) push("error", `fiber (${n.fiber}) is more than carbohydrates (${n.carbohydrates})`);
  if (n.sugar > n.carbohydrates + LIMITS.maxSugarOverCarbG) push("error", `sugar (${n.sugar}) is more than carbohydrates (${n.carbohydrates})`);

  if (isAlcohol) return;

  const expected = atwaterCalories(n);
  const gap = Math.abs(expected - n.calories);
  if (n.calories < LIMITS.tinyCalories) {
    if (gap > LIMITS.tinyCalorieSlack) push("warning", `calories ${n.calories} vs ${Math.round(expected)} from macros`);
    return;
  }
  const ratio = gap / n.calories;
  if (ratio > LIMITS.calorieErrorRatio && gap > LIMITS.calorieErrorKcal) push("error", `calories ${n.calories} but macros give ~${Math.round(expected)}`);
  else if (ratio > LIMITS.calorieWarnRatio && gap > LIMITS.calorieWarnKcal) push("warning", `calories ${n.calories} but macros give ~${Math.round(expected)}`);
}

function checkServings(raw: RawFood, push: (level: Issue["level"], message: string) => void): void {
  if (!raw.servingOptions?.length) return push("error", "no servingOptions");
  const seen = new Set<string>();
  for (const o of raw.servingOptions) {
    if (!o.label) push("error", "serving option without a label");
    if (!resolveUnitId(o.unit)) push("error", `serving "${o.label}" uses unknown unit "${o.unit}"`);
    const key = baseUnitId(resolveUnitId(o.unit) ?? o.unit);
    if (seen.has(key)) push("error", `two servings share the unit "${key}" — calculations would be ambiguous`);
    seen.add(key);
    if (o.grams === undefined) {
      if (!isComposite(raw)) push("error", `serving "${o.label}" has no grams`);
    } else if (!(o.grams > 0) || o.grams > LIMITS.maxServingGrams) push("error", `serving "${o.label}" has impossible size ${o.grams} g`);
  }
}

function checkRange(raw: RawFood, push: (level: Issue["level"], message: string) => void): void {
  if (raw.variability === "high" && !raw.estimateRange) return;
  for (const key of RANGE_KEYS) {
    const r = raw.estimateRange?.[key];
    if (!r) continue;
    if (!(r.low <= r.typical && r.typical <= r.high)) push("error", `estimateRange.${key} is not low <= typical <= high`);
    if (raw.nutritionPer100g && r.typical !== raw.nutritionPer100g[key]) push("error", `estimateRange.${key}.typical (${r.typical}) differs from nutritionPer100g (${raw.nutritionPer100g[key]})`);
  }
}

export function validateDataset(): Issue[] {
  if (!foodsLoaded()) setDataFiles(DATA_FILES);
  const issues: Issue[] = [];
  const ids = new Map<string, string>();
  const names = new Map<string, string>();
  const { categories, cuisines, foodTypes, mealTypes, dietaryTags, confidence, dataSourceTypes, variability } = categoriesJson;

  for (const { name: file, data } of DATA_FILES) {
    const fileDefaults = data.defaults ?? {};
    for (const raw of data.foods) {
      const id = raw.id ?? "(no id)";
      const push = (level: Issue["level"], message: string) => issues.push({ level, id, file, message });

      if (!raw.id || !/^[a-z0-9]+(_[a-z0-9]+)*$/.test(raw.id)) push("error", "id must be snake_case a-z 0-9");
      if (ids.has(raw.id)) push("error", `duplicate id (also in ${ids.get(raw.id)})`);
      else ids.set(raw.id, file);
      const nameKey = normalizeText(raw.name ?? "");
      if (!nameKey) push("error", "missing name");
      else if (names.has(nameKey)) push("error", `duplicate name "${raw.name}" (also in ${names.get(nameKey)})`);
      else names.set(nameKey, file);

      const category = raw.category ?? fileDefaults.category;
      const cat = category ? (categories as Record<string, { subCategories: string[] }>)[category] : undefined;
      if (!cat) push("error", `invalid category "${category}"`);
      else if (!cat.subCategories.includes(raw.subCategory)) push("error", `subCategory "${raw.subCategory}" is not defined under "${category}"`);
      const cuisine = raw.cuisine ?? fileDefaults.cuisine;
      if (!cuisine || !cuisines.includes(cuisine)) push("error", `invalid cuisine "${cuisine}"`);
      const foodType = raw.foodType ?? fileDefaults.foodType;
      if (!isComposite(raw) && (!foodType || !foodTypes.includes(foodType))) push("error", `invalid foodType "${foodType}"`);
      if (!raw.aliases?.length) push("warning", "no aliases");
      for (const meal of raw.mealTypes ?? []) if (!mealTypes.includes(meal)) push("error", `invalid mealType "${meal}"`);
      for (const tag of raw.tags ?? []) if (!dietaryTags.includes(tag)) push("error", `unknown tag "${tag}"`);
      const conf = raw.nutritionConfidence ?? fileDefaults.nutritionConfidence;
      if (conf && !confidence.includes(conf)) push("error", `invalid nutritionConfidence "${conf}"`);
      const source = raw.dataSourceType ?? fileDefaults.dataSourceType;
      if (source && !dataSourceTypes.includes(source)) push("error", `invalid dataSourceType "${source}"`);
      const vari = raw.variability ?? fileDefaults.variability;
      if (vari && !variability.includes(vari)) push("error", `invalid variability "${vari}"`);

      if (raw.foodType === "vegan" && (raw.tags ?? []).some((t) => NON_VEGAN_TAGS.includes(t))) push("error", "a vegan food cannot carry a dairy or egg tag");
      checkServings(raw, push);
      checkRange(raw, push);
      if (isComposite(raw)) {
        for (const part of (raw.ingredients ?? []) as CompositeIngredient[]) {
          if (!part.foodId || !part.unit) push("error", "composite ingredient needs foodId, quantity and unit");
        }
      } else checkNutrition(raw.nutritionPer100g, push, raw.subCategory === ALCOHOL_SUB_CATEGORY);
    }
  }

  for (const food of getAllFoods()) {
    const push = (level: Issue["level"], message: string) => issues.push({ level, id: food.id, file: food.sourceFile, message });
    if (!food.searchableText) push("error", "missing searchableText");
    if (food.type === "composite") checkNutrition(food.nutritionPer100g, push, food.subCategory === ALCOHOL_SUB_CATEGORY);
  }
  for (const id of popular.ids) if (!getFoodById(id)) issues.push({ level: "error", id, file: "popular-foods", message: "popular-foods.json lists an id that does not exist" });
  return issues;
}
