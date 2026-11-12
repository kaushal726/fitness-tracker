import { useMemo } from "react";
import { useAppState } from "../../data/store.ts";
import type { Profile } from "../../data/types.ts";
import { weightPoints, type WeightPoint } from "../../domain/weighIns.ts";

/** Every known weight, oldest first, worked out again only when the log or the profile's weight changes. */
export function useWeightPoints(profile: Profile): WeightPoint[] {
  const { weights } = useAppState();
  return useMemo(() => weightPoints(weights, profile), [weights, profile]);
}
