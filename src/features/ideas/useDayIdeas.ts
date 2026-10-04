import { useMemo } from "react";
import type { Targets } from "../../data/types.ts";
import { dayIdeas, type DayIdeas } from "../../domain/ideas.ts";
import { popularFoods } from "../../nutrition/index.ts";
import type { NutritionTotals } from "../../nutrition/types.ts";
import { useFoods } from "../add/useFoods.ts";

/** Foods that would put the day right, for the one or two things most off. Empty while the food data is still arriving. */
export function useDayIdeas(totals: NutritionTotals, targets: Targets, enabled: boolean): DayIdeas[] {
  const { status } = useFoods();
  const hour = new Date().getHours();
  return useMemo(() => (enabled && status === "ready" ? dayIdeas(totals, targets, hour, popularFoods()) : []), [enabled, status, totals, targets, hour]);
}
