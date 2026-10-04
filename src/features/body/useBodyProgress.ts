import { useMemo } from "react";
import { useAppState } from "../../data/store.ts";
import type { Profile } from "../../data/types.ts";
import { bodyProgress, type BodyProgress } from "../../domain/bodyProgress.ts";
import { computePlan, goalDef, type GoalDef, type Plan } from "../../domain/goals.ts";

export interface BodyView {
  plan: Plan;
  goal: GoalDef;
  progress: BodyProgress;
}

/** The numbers behind the Body page, worked out again only when the food log, the profile or the plan changes. */
export function useBodyProgress(profile: Profile, today: string): BodyView {
  const { entries, settings } = useAppState();
  const plan = useMemo(() => computePlan(profile, settings.customCalories), [profile, settings.customCalories]);
  const progress = useMemo(
    () => bodyProgress({ entries, profile, tdee: plan.tdee, goalCalories: plan.targets.calories, today }),
    [entries, profile, plan.tdee, plan.targets.calories, today],
  );
  return { plan, goal: goalDef(profile.goal), progress };
}
