/* Water drunk each day. Two things add up to a day's water: what was tapped on the water card (kept in millilitres per
 * day) and plain water logged as a food. Everything here is pure, so the screens only read and show.
 */
import type { Entry } from "../data/types.ts";

/** Millilitres tapped in on each day (YYYY-MM-DD). A day with none has no key. */
export type WaterLog = Readonly<Record<string, number>>;

export const DEFAULT_WATER_GOAL_ML = 2000;
export const DEFAULT_GLASS_ML = 250;
export const GLASS_SIZES_ML = [200, 250, 300, 500] as const;
export const MIN_WATER_GOAL_ML = 1000;
export const MAX_WATER_GOAL_ML = 6000;
export const WATER_GOAL_STEP_ML = 250;
export const BOTTLE_ML = 500;
export const LARGE_BOTTLE_ML = 1000;
/** More than anyone drinks in a day: a stop for a stuck finger, not a health limit. */
const MAX_DAY_ML = 12_000;
const ML_PER_LITRE = 1000;

/** Foods that are plain water: logging one of them counts as water drunk (one gram is one millilitre). */
const PLAIN_WATER_FOOD_IDS: ReadonlySet<string> = new Set(["water", "mineral_water", "soda_water"]);

/** What was tapped in on that day. */
export function trackedWater(log: WaterLog, date: string): number {
  return log[date] ?? 0;
}

/** The log after `deltaMl` more (or less, when negative) on that day. Never below zero, and an empty day is forgotten. */
export function withWater(log: WaterLog, date: string, deltaMl: number): WaterLog {
  const next = Math.min(MAX_DAY_ML, Math.max(0, trackedWater(log, date) + deltaMl));
  const { [date]: _previous, ...rest } = log;
  return next > 0 ? { ...rest, [date]: next } : rest;
}

/** Millilitres of plain water logged as food, by day. */
export function foodWaterByDate(entries: Entry[]): Map<string, number> {
  const byDate = new Map<string, number>();
  for (const e of entries) {
    if (PLAIN_WATER_FOOD_IDS.has(e.foodId)) byDate.set(e.date, (byDate.get(e.date) ?? 0) + e.grams);
  }
  return byDate;
}

/** All the water of each day that has any: tapped in, plus plain water logged as food. */
export function waterByDate(log: WaterLog, entries: Entry[]): Map<string, number> {
  const byDate = foodWaterByDate(entries);
  for (const [date, ml] of Object.entries(log)) byDate.set(date, (byDate.get(date) ?? 0) + ml);
  return byDate;
}

/** How many glasses that is, to one decimal: 625 ml in 250 ml glasses is 2.5. */
export function glassesOf(ml: number, glassMl: number): number {
  return glassMl > 0 ? Math.round((ml / glassMl) * 10) / 10 : 0;
}

/** How far toward the goal, 0 to 1. */
export function waterShare(ml: number, goalMl: number): number {
  return goalMl > 0 ? Math.min(1, Math.max(0, ml / goalMl)) : 0;
}

/** "750 ml" under a litre, "1.25 L" from there on, without trailing zeros. */
export function formatVolume(ml: number): string {
  if (ml < ML_PER_LITRE) return `${Math.round(ml)} ml`;
  return `${Number((ml / ML_PER_LITRE).toFixed(2))} L`;
}

/** A goal kept inside what the app offers, on a step. */
export function clampWaterGoal(ml: number): number {
  const stepped = Math.round(ml / WATER_GOAL_STEP_ML) * WATER_GOAL_STEP_ML;
  return Math.min(MAX_WATER_GOAL_ML, Math.max(MIN_WATER_GOAL_ML, stepped));
}

export interface WaterSummary {
  /** Days that have any water. */
  days: number;
  /** Millilitres on an average day that has water. */
  averageMl: number;
  /** Days the goal was reached. */
  daysReached: number;
}

/** How the given days went against the goal. Days with no water are left out of the average: they were not tracked, not dry. */
export function waterSummary(dates: string[], byDate: ReadonlyMap<string, number>, goalMl: number): WaterSummary {
  const amounts = dates.map((d) => byDate.get(d) ?? 0).filter((ml) => ml > 0);
  const total = amounts.reduce((sum, ml) => sum + ml, 0);
  return { days: amounts.length, averageMl: amounts.length ? total / amounts.length : 0, daysReached: amounts.filter((ml) => ml >= goalMl).length };
}
