import { useAppState } from "../../data/store.ts";
import { waterGoal, type WaterGoal } from "../../domain/water.ts";

/** The water goal in use: the person's own if they set one, else the one worked out from their body. */
export function useWaterGoal(): WaterGoal {
  const { profile, settings } = useAppState();
  return waterGoal(profile, settings.customWaterGoalMl);
}
