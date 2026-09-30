import type { Targets } from "../data/types.ts";
import type { NutritionTotals } from "../nutrition/types.ts";

export type InsightTone = "good" | "warn" | "info";
export interface Insight {
  tone: InsightTone;
  text: string;
}

const OVER_SHARE = 1.1;
const ON_TRACK_MIN_SHARE = 0.9;
const LOW_PROTEIN_SHARE = 0.7;
const PROTEIN_CHECK_HOUR = 17;
const PROTEIN_SOURCES = "Eggs, paneer, dal or chicken can help.";

/** One short line about how the day is going, or null when there is nothing useful to say. */
export function dayInsight(totals: NutritionTotals, targets: Targets, hasEntries: boolean, hour: number): Insight | null {
  if (!hasEntries) return { tone: "info", text: "Nothing logged yet. Tap Add Food to begin." };
  if (totals.calories > targets.calories * OVER_SHARE) {
    return { tone: "warn", text: `${Math.round(totals.calories - targets.calories)} kcal over your goal today.` };
  }
  const proteinShort = targets.protein - totals.protein;
  if (hour >= PROTEIN_CHECK_HOUR && totals.protein < targets.protein * LOW_PROTEIN_SHARE) {
    return { tone: "warn", text: `Protein is ${Math.round(proteinShort)} g short. ${PROTEIN_SOURCES}` };
  }
  if (totals.calories >= targets.calories * ON_TRACK_MIN_SHARE && totals.protein >= targets.protein * ON_TRACK_MIN_SHARE) {
    return { tone: "good", text: "Right on track today." };
  }
  return null;
}
