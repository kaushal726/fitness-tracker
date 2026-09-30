/* Food -> Serving -> Nutrition.
 *
 * A food stores its nutrition once, per 100 g (or 100 ml, treated as 100 g via `densityGPerMl`).
 * A serving is only a named weight ("1 dosa" = 80 g). Every quantity the user can type is
 * turned into grams and scaled, so nothing is stored per quantity.
 * Food ids are permanent: logs reference them, so never rename one — add a new food instead.
 */

export type FoodType = "vegetarian" | "non_vegetarian" | "vegan" | "eggetarian";
export type MealType = "breakfast" | "lunch" | "snack" | "dinner";
export type Confidence = "high" | "medium" | "low";
export type DataSourceType = "standard_reference" | "estimated" | "recipe_based";
export type Variability = "low" | "medium" | "high";

/** Calories in kcal, sodium and cholesterol in mg, everything else in grams. */
export interface Nutrition {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
}

export type NutrientKey = keyof Nutrition;

/** What a calculation returns. Same numbers, with `carbohydrates` shortened to `carbs`. */
export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface ServingOption {
  /** Shown to the user: "1 dosa", "1 katori". Always one unit of `unit`. */
  label: string;
  /** A unit id from serving-units.json. */
  unit: string;
  grams: number;
}

export interface EstimateRange {
  low: number;
  typical: number;
  high: number;
}

/** For high-variability foods: the spread of a 100 g portion. `typical` must equal nutritionPer100g. */
export type NutritionEstimateRange = Partial<Record<"calories" | "protein" | "carbohydrates" | "fat", EstimateRange>>;

export interface CompositeIngredient {
  foodId: string;
  quantity: number;
  unit: string;
}

/** A food as written in data/foods/*.json. Fields marked derived are filled by the loader. */
export interface RawFood {
  id: string;
  name: string;
  aliases: string[];
  category?: string;
  subCategory: string;
  cuisine?: string;
  foodType?: FoodType;
  type?: "simple" | "composite";
  /** First option is the default serving. Composite foods omit `grams`; it is computed. */
  servingOptions: (Omit<ServingOption, "grams"> & { grams?: number })[];
  /** Absent on composite foods: computed from `ingredients`. */
  nutritionPer100g?: Nutrition;
  /** Grams per ml, for drinks and oils whose ml servings must not be treated as water. */
  densityGPerMl?: number;
  preparationMethod?: string;
  /** Free-text list for simple foods; structured references for composite ones. */
  ingredients?: string[] | CompositeIngredient[];
  tags?: string[];
  mealTypes?: MealType[];
  nutritionConfidence?: Confidence;
  dataSourceType?: DataSourceType;
  variability?: Variability;
  estimateRange?: NutritionEstimateRange;
  /** Set on branded entries only. Generic foods never carry a brand. */
  brand?: string;
}

export interface RawFile {
  /** Values every food in the file inherits unless it sets its own. `tags` are merged. */
  defaults: Partial<Pick<RawFood, "category" | "cuisine" | "foodType" | "nutritionConfidence" | "dataSourceType" | "variability" | "tags" | "mealTypes">>;
  foods: RawFood[];
}

/** A food ready to use: defaults applied, derived fields filled. */
export interface Food {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  subCategory: string;
  cuisine: string;
  foodType: FoodType;
  type: "simple" | "composite";
  servingOptions: ServingOption[];
  nutritionPer100g: Nutrition;
  nutritionPerServing: Nutrition;
  densityGPerMl: number;
  preparationMethod?: string;
  ingredients?: string[] | CompositeIngredient[];
  tags: string[];
  mealTypes: MealType[];
  nutritionConfidence: Confidence;
  dataSourceType: DataSourceType;
  variability: Variability;
  estimateRange?: NutritionEstimateRange;
  brand?: string;
  searchableText: string;
  /** Which data file it came from, for validation messages. */
  sourceFile: string;
}

export interface UnitDef {
  label: string;
  kind: "mass" | "volume" | "count";
  gramsPerUnit?: number;
  mlPerUnit?: number;
  aliasOf?: string;
  aliases: string[];
}

export interface FoodQuantity {
  foodId: string;
  quantity: number;
  unit: string;
}

export interface MealInput {
  mealType: MealType;
  items: FoodQuantity[];
}

export interface CalculatedItem extends FoodQuantity {
  grams: number;
  nutrition: NutritionTotals;
}

export interface MealNutrition {
  items: CalculatedItem[];
  totals: NutritionTotals;
}

export interface DailyNutrition {
  meals: Record<MealType, MealNutrition>;
  totals: NutritionTotals;
  /** Present only when targets were given. Negative `remaining` means over target. */
  remaining?: NutritionTotals;
}
