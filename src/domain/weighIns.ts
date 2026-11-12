/* The weekly weigh-in: the weights stepped on the scale, one a day at most, and how they are moving against the goal.
 * Saturday is weigh-in day; the ask stays up on Sunday too for a Saturday that was missed. Pure, so screens only show.
 */
import type { Profile } from "../data/types.ts";
import { addDays, daysBetween, parseISODate } from "../lib/dates.ts";
import { PROFILE_LIMITS } from "./goals.ts";

/** Kilograms on each day weighed (YYYY-MM-DD). */
export type WeightLog = Readonly<Record<string, number>>;

export interface WeightPoint {
  date: string;
  kg: number;
}

/** Saturday, as `Date.getDay()` counts. */
export const WEIGH_IN_WEEKDAY = 6;
/** Days after Saturday the ask still shows when the scale was missed. */
const GRACE_DAYS = 1;
const DAYS_IN_WEEK = 7;
/** A change smaller than this, either way, is the scale's own wobble. */
export const STEADY_KG = 0.2;
export const WEIGHT_STEP_KG = 0.1;
export const [MIN_KG, MAX_KG] = PROFILE_LIMITS.weightKg;

const roundKg = (kg: number): number => Math.round(kg * 10) / 10;

/** A weight kept inside what the app accepts, to one decimal. */
export function clampKg(kg: number): number {
  return roundKg(Math.min(MAX_KG, Math.max(MIN_KG, kg)));
}

/** The log with that day's weight set (a second weigh-in on one day replaces the first). */
export function withWeighIn(log: WeightLog, date: string, kg: number): WeightLog {
  return { ...log, [date]: clampKg(kg) };
}

/**
 * Every known weight, oldest first: the log, plus the profile's weight on the day it was entered when the log does not
 * have that day (a weight entered before the log existed).
 */
export function weightPoints(log: WeightLog, profile: Pick<Profile, "weightKg" | "weightDate">): WeightPoint[] {
  const all: Record<string, number> = { ...log };
  if (profile.weightDate && all[profile.weightDate] === undefined) all[profile.weightDate] = profile.weightKg;
  return Object.entries(all)
    .map(([date, kg]) => ({ date, kg }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** The latest Saturday on or before the day. */
export function weighInDayFor(today: string): string {
  const weekday = parseISODate(today).getDay();
  return addDays(today, -((weekday - WEIGH_IN_WEEKDAY + DAYS_IN_WEEK) % DAYS_IN_WEEK));
}

/** Whether to ask for this week's weight: it is Saturday (or the day after), and nothing was weighed since Saturday. */
export function weighInDue(points: WeightPoint[], today: string): boolean {
  const saturday = weighInDayFor(today);
  if (daysBetween(saturday, today) > GRACE_DAYS) return false;
  return !points.some((p) => p.date >= saturday);
}

export type WeighInTrend = "toward" | "away" | "steady";

export interface WeighInSummary {
  latest: WeightPoint;
  /** The weigh-in before the latest, when there is one. */
  previous: WeightPoint | null;
  /** Latest less previous; null with only one weigh-in. */
  changeKg: number | null;
  /** Latest less the first weigh-in. */
  totalKg: number;
  /** Which way the latest change went for the goal. */
  trend: WeighInTrend | null;
  /** Kilograms between the latest weight and the target; null without a target. */
  toGoKg: number | null;
  /** The latest weight is at the target or past it. */
  reached: boolean;
}

/** How the weigh-ins are going, for a goal that loses (-1), keeps (0) or gains (1), with its target weight when it has one. */
export function weighInSummary(points: WeightPoint[], direction: -1 | 0 | 1, targetKg: number | null): WeighInSummary | null {
  if (points.length === 0) return null;
  const latest = points[points.length - 1];
  const previous = points.length > 1 ? points[points.length - 2] : null;
  const changeKg = previous ? roundKg(latest.kg - previous.kg) : null;
  const target = direction === 0 ? null : targetKg;
  const reached = target !== null && Math.sign(target - latest.kg) !== direction;
  return {
    latest,
    previous,
    changeKg,
    totalKg: roundKg(latest.kg - points[0].kg),
    trend: changeKg === null ? null : trendOf(changeKg, direction),
    toGoKg: target === null || reached ? null : roundKg(Math.abs(target - latest.kg)),
    reached,
  };
}

function trendOf(changeKg: number, direction: -1 | 0 | 1): WeighInTrend {
  if (Math.abs(changeKg) < STEADY_KG) return "steady";
  if (direction === 0) return "away";
  return Math.sign(changeKg) === direction ? "toward" : "away";
}

/** A change in kilograms with a real minus sign, one decimal: "+0.4", "−1.2", "0". */
export function signedKg(kg: number): string {
  const rounded = roundKg(kg);
  return rounded > 0 ? `+${rounded}` : rounded < 0 ? `−${Math.abs(rounded)}` : "0";
}
