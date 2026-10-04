/* Remembers when the weight in the profile was entered, and what the first one was, so progress can be counted from the
 * right day: food logged before a new weigh-in is already inside that weigh-in.
 */
import type { Profile } from "../data/types.ts";

/**
 * Returns `next` with `weightDate` and `startWeightKg` filled in. A new profile, or a changed weight, is dated today;
 * anything else keeps what the saved profile had (older profiles have neither, and keep not having them).
 */
export function stampWeight(next: Profile, previous: Profile | null, today: string): Profile {
  if (previous === null) return { ...next, weightDate: today, startWeightKg: next.weightKg };
  if (next.weightKg !== previous.weightKg) return { ...next, weightDate: today, startWeightKg: previous.startWeightKg ?? previous.weightKg };
  return { ...next, weightDate: previous.weightDate ?? next.weightDate, startWeightKg: previous.startWeightKg ?? next.startWeightKg };
}
