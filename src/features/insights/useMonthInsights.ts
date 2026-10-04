import { useMemo } from "react";
import { useAppState } from "../../data/store.ts";
import type { Profile, Targets } from "../../data/types.ts";
import { calorieFloor, computePlan, goalDef } from "../../domain/goals.ts";
import type { MonthId } from "../../domain/month.ts";
import { monthInsights, type MonthInsights } from "../../domain/monthInsights.ts";

export interface MonthView {
  insights: MonthInsights;
  targets: Targets;
  /** -1 when the aim is to eat less, 0 to stay, 1 to eat more. */
  direction: -1 | 0 | 1;
}

/** The numbers behind the Insights page for one month, worked out again only when what they depend on changes. */
export function useMonthInsights(profile: Profile, today: string, month: MonthId): MonthView {
  const { entries, settings } = useAppState();
  const plan = useMemo(() => computePlan(profile, settings.customCalories), [profile, settings.customCalories]);
  const insights = useMemo(
    () => monthInsights({ entries, goal: plan.targets.calories, floor: calorieFloor(profile.gender), month, today }),
    [entries, plan.targets.calories, profile.gender, month, today],
  );
  return { insights, targets: plan.targets, direction: goalDef(profile.goal).direction };
}
