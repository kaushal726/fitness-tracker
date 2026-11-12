import { useMemo } from "react";
import { addWater, useAppState } from "../../data/store.ts";
import { foodWaterByDate, glassesOf, trackedWater, waterShare } from "../../domain/water.ts";

export interface DayWater {
  /** All the water of the day: tapped in, plus plain water logged as food. */
  ml: number;
  /** The part that was tapped in, which is what can be taken back. */
  trackedMl: number;
  goalMl: number;
  glassMl: number;
  glasses: number;
  /** 0 to 1 of the goal. */
  share: number;
  reached: boolean;
  /** Adds water to the day, or takes some back with a negative amount. */
  add: (ml: number) => void;
}

/** One day's water against the goal, and the way to add to it. */
export function useWater(date: string): DayWater {
  const { water, entries, settings } = useAppState();
  const fromFood = useMemo(() => foodWaterByDate(entries).get(date) ?? 0, [entries, date]);
  const trackedMl = trackedWater(water, date);
  const ml = trackedMl + fromFood;
  const { waterGoalMl: goalMl, waterGlassMl: glassMl } = settings;
  return { ml, trackedMl, goalMl, glassMl, glasses: glassesOf(ml, glassMl), share: waterShare(ml, goalMl), reached: ml >= goalMl, add: (amount) => addWater(date, amount) };
}
