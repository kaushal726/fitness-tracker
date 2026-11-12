import type { Targets } from "../data/types.ts";
import type { NutritionTotals } from "../nutrition/types.ts";

export const OVER_SHARE = 1.1;
const ON_TRACK_MIN_SHARE = 0.9;
export const LOW_PROTEIN_SHARE = 0.7;
export const PROTEIN_CHECK_HOUR = 17;
/** A day that is over has run its course: its whole day counts, whatever the clock says now. */
export const END_OF_DAY_HOUR = 24;

/** How the day's calories stand: past the goal, on track (calories and protein both close to their goals), or nothing worth a word. */
export type CalorieStatus = "over" | "onTrack";

export function calorieStatus(totals: NutritionTotals, targets: Targets): CalorieStatus | null {
  if (totals.calories > targets.calories * OVER_SHARE) return "over";
  if (totals.calories >= targets.calories * ON_TRACK_MIN_SHARE && totals.protein >= targets.protein * ON_TRACK_MIN_SHARE) return "onTrack";
  return null;
}

/** Grams of protein still missing, once it is late enough in the day for that to matter; null while it is not worth a word. */
export function proteinShortfall(totals: NutritionTotals, targets: Targets, hour: number): number | null {
  if (hour < PROTEIN_CHECK_HOUR || totals.protein >= targets.protein * LOW_PROTEIN_SHARE) return null;
  return Math.round(targets.protein - totals.protein);
}
