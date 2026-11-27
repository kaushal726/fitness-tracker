/* Settings saved by an older version, brought up to the shape the app reads now.
 *
 * Water goal: it used to be one number that every phone started at 2000. It is now worked out from body weight unless the
 * person set their own, so an old 2000 is read as "never set" and any other number as "set by hand".
 */
import { DEFAULT_WATER_GOAL_ML } from "../domain/water.ts";
import type { Settings } from "./types.ts";

type Saved = Partial<Settings> & { waterGoalMl?: number };

export function migrateSettings(saved: Saved | null | undefined, defaults: Settings): Settings {
  const { waterGoalMl: legacyGoal, ...current } = saved ?? {};
  const merged: Settings = { ...defaults, ...current };
  if (current.customWaterGoalMl === undefined && typeof legacyGoal === "number" && legacyGoal !== DEFAULT_WATER_GOAL_ML) {
    merged.customWaterGoalMl = legacyGoal;
  }
  return merged;
}
