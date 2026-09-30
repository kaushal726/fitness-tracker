import type { MealType, NutritionTotals } from "../nutrition/types.ts";

export type Gender = "male" | "female";
export type GoalId = "lose_fat" | "lose_weight" | "maintain" | "gain_muscle" | "gain_weight";
export type ActivityId = "sedentary" | "light" | "moderate" | "active" | "athlete";

export interface Profile {
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  goal: GoalId;
  /** Only for goals that change weight. */
  targetWeightKg: number | null;
  weeks: number | null;
  activity: ActivityId;
}

/** Daily targets in grams, calories in kcal. */
export interface Targets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface Settings {
  /** Hour of day (0-24, halves allowed) each meal starts. Order must be breakfast < lunch < snack < dinner. */
  mealStartHours: Record<MealType, number>;
  /** When set, replaces the calculated calorie target. */
  customCalories: number | null;
  /** One short thought a day: when the app opens, and on History. */
  dailyThought: boolean;
  /** The last day (YYYY-MM-DD) the opening screen showed the thought, so it appears once a day. */
  lastThoughtDate: string | null;
}

export interface Entry {
  id: string;
  /** Local day, YYYY-MM-DD. */
  date: string;
  /** When it was logged (ms). Orders the day. */
  at: number;
  meal: MealType;
  foodId: string;
  /** Snapshot, so an entry keeps reading right if the food is later renamed or removed. */
  name: string;
  quantity: number;
  unit: string;
  /** Text like "2 × dosa" or "200 g", built when saved. */
  portionText: string;
  grams: number;
  nutrition: NutritionTotals;
}

export interface LastUsed {
  quantity: number;
  unit: string;
}

export interface Backup {
  /** Fixed marker that identifies the file format. It is not the display name and must never change. */
  app: "fitly";
  version: 1;
  exportedAt: string;
  profile: Profile | null;
  settings: Settings;
  entries: Entry[];
  customFoods: import("../nutrition/types.ts").Food[];
  favorites: string[];
  lastUsed: Record<string, LastUsed>;
}
