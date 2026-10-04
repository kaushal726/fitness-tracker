/* How the body is changing, worked out from the food that was logged.
 *
 * Each finished, fully logged day is compared with what the body uses (the plan's energy use, `tdee`). What is eaten
 * above it is stored, what is below it is lost, and about 7700 kcal stand for a kilogram. Days with nothing logged, and
 * days with so little logged that they look half-done, say nothing about the body and are left out, as on the month page.
 * Counting starts the day after the weight was entered: food logged before a weigh-in is already inside that weight.
 *
 * It is an estimate: water, muscle, and a plan's activity level that is a little off all move the real number.
 */
import type { Entry, Profile } from "../data/types.ts";
import { addDays, daysBetween } from "../lib/dates.ts";
import { KCAL_PER_KG } from "./goals.ts";
import { weekdayIndex } from "./month.ts";
import { PARTIAL_DAY_SHARE } from "./monthInsights.ts";

const DAYS_PER_WEEK = 7;
/** The pace is the average of this many of the latest counted days, so it follows what is happening now. */
export const PACE_WINDOW_DAYS = 30;
/** With fewer counted days than this a pace would be noise. */
export const MIN_PACE_DAYS = 3;
/** Moving less than this a week is holding steady. */
export const STEADY_KG_PER_WEEK = 0.05;
/** Faster than this a week is more often missed logging than a real change. */
export const FAST_KG_PER_WEEK = 1.2;
/** A date further off than this is not worth giving. */
export const MAX_ETA_DAYS = 365 * 3;
export const WEEKS_SHOWN = 8;
const REACHED_WITHIN_KG = 0.1;

export interface WeightPoint {
  date: string;
  kg: number;
}

export interface WeekChange {
  /** The Monday of the week. */
  start: string;
  /** Counted days in it. */
  days: number;
  /** Eaten minus used, added up: negative is a deficit. */
  netKcal: number;
  kg: number;
}

export type TargetStatus = "reached" | "heading" | "steady" | "away" | "unknown";

export interface TargetProgress {
  kg: number;
  /** From the estimated weight to the target: negative when the target is lower. */
  toGoKg: number;
  /** How much of the way from the first weight to the target is done, 0 to 1. */
  fraction: number;
  status: TargetStatus;
  /** Days to the target at the current pace; only while heading there. */
  etaDays: number | null;
  /** The day that is, or null when it is too far off to be worth giving. */
  etaDate: string | null;
}

export interface BodyProgress {
  /** The weight the estimate starts from and the day it was entered (or, for older profiles, the first logged day). */
  baseKg: number;
  since: string;
  startKg: number;
  /** Finished days since the weigh-in, logged or not. */
  elapsedDays: number;
  countedDays: number;
  /** Eaten minus used over every counted day: negative is a deficit. */
  netKcal: number;
  /** What that comes to in body weight: negative is lost. */
  changeKg: number;
  /** Estimated weight now. */
  currentKg: number;
  /** Counted days behind the pace, at most `PACE_WINDOW_DAYS`. */
  paceDays: number;
  avgEaten: number | null;
  /** Grams of protein a day over the same days. */
  avgProtein: number | null;
  avgNetKcal: number | null;
  kgPerWeek: number | null;
  target: TargetProgress | null;
  /** The estimated weight from the start, one point per counted day, ending today. */
  path: WeightPoint[];
  /** The latest calendar weeks, oldest first, from the first one that has a counted day. */
  weeks: WeekChange[];
}

interface Input {
  entries: Entry[];
  profile: Profile;
  /** What the body uses a day. */
  tdee: number;
  /** The day's calorie target: a day with under 40% of it is taken as half-logged. */
  goalCalories: number;
  today: string;
}

interface CountedDay {
  date: string;
  eaten: number;
  protein: number;
  net: number;
}

const mean = (values: number[]): number => values.reduce((sum, v) => sum + v, 0) / values.length;
const weekStart = (iso: string): string => addDays(iso, -weekdayIndex(iso));

function countedDays({ entries, tdee, goalCalories, today }: Input, from: string): CountedDay[] {
  const totals = new Map<string, { eaten: number; protein: number }>();
  for (const e of entries) {
    if (e.date < from || e.date >= today) continue;
    const day = totals.get(e.date) ?? { eaten: 0, protein: 0 };
    day.eaten += e.nutrition.calories;
    day.protein += e.nutrition.protein;
    totals.set(e.date, day);
  }
  return [...totals]
    .filter(([, day]) => day.eaten >= goalCalories * PARTIAL_DAY_SHARE)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, day]) => ({ date, eaten: day.eaten, protein: day.protein, net: day.eaten - tdee }));
}

function weeksOf(days: CountedDay[], today: string): WeekChange[] {
  const byWeek = new Map<string, WeekChange>();
  for (const d of days) {
    const start = weekStart(d.date);
    const week = byWeek.get(start) ?? { start, days: 0, netKcal: 0, kg: 0 };
    week.days += 1;
    week.netKcal += d.net;
    week.kg = week.netKcal / KCAL_PER_KG;
    byWeek.set(start, week);
  }
  const first = days.length > 0 ? weekStart(days[0].date) : weekStart(today);
  const weeks: WeekChange[] = [];
  for (let start = weekStart(today); start >= first && weeks.length < WEEKS_SHOWN; start = addDays(start, -DAYS_PER_WEEK)) {
    weeks.unshift(byWeek.get(start) ?? { start, days: 0, netKcal: 0, kg: 0 });
  }
  return weeks;
}

function targetProgress(profile: Profile, startKg: number, currentKg: number, kgPerWeek: number | null, today: string): TargetProgress | null {
  const kg = profile.targetWeightKg;
  if (kg === null) return null;
  const toGoKg = kg - currentKg;
  const wholeKg = kg - startKg;
  const fraction = wholeKg === 0 ? 1 : Math.min(1, Math.max(0, (currentKg - startKg) / wholeKg));
  const passed = Math.abs(toGoKg) < REACHED_WITHIN_KG || (wholeKg !== 0 && Math.sign(toGoKg) !== Math.sign(wholeKg));
  const base = { kg, toGoKg, fraction, etaDays: null, etaDate: null };
  if (passed) return { ...base, fraction: 1, status: "reached" };
  if (kgPerWeek === null) return { ...base, status: "unknown" };
  if (Math.abs(kgPerWeek) < STEADY_KG_PER_WEEK) return { ...base, status: "steady" };
  if (Math.sign(kgPerWeek) !== Math.sign(toGoKg)) return { ...base, status: "away" };
  const etaDays = Math.ceil(Math.abs(toGoKg) / (Math.abs(kgPerWeek) / DAYS_PER_WEEK));
  return { ...base, status: "heading", etaDays, etaDate: etaDays <= MAX_ETA_DAYS ? addDays(today, etaDays) : null };
}

export function bodyProgress(input: Input): BodyProgress {
  const { entries, profile, today } = input;
  const firstLogged = entries.reduce((first, e) => (e.date < first ? e.date : first), today);
  const since = profile.weightDate ?? firstLogged;
  const from = profile.weightDate ? addDays(profile.weightDate, 1) : firstLogged;
  const days = countedDays(input, from);

  const baseKg = profile.weightKg;
  const startKg = profile.startWeightKg ?? profile.weightKg;
  const netKcal = days.reduce((sum, d) => sum + d.net, 0);
  const changeKg = netKcal / KCAL_PER_KG;
  const currentKg = baseKg + changeKg;

  const recent = days.slice(-PACE_WINDOW_DAYS);
  const enough = recent.length >= MIN_PACE_DAYS;
  const avgNetKcal = enough ? mean(recent.map((d) => d.net)) : null;
  const kgPerWeek = avgNetKcal === null ? null : (avgNetKcal * DAYS_PER_WEEK) / KCAL_PER_KG;

  let running = baseKg;
  const path: WeightPoint[] = [{ date: since, kg: baseKg }];
  for (const d of days) {
    running += d.net / KCAL_PER_KG;
    path.push({ date: d.date, kg: running });
  }
  if (path[path.length - 1].date < today) path.push({ date: today, kg: running });

  return {
    baseKg,
    since,
    startKg,
    elapsedDays: Math.max(0, daysBetween(from, today)),
    countedDays: days.length,
    netKcal,
    changeKg,
    currentKg,
    paceDays: recent.length,
    avgEaten: enough ? mean(recent.map((d) => d.eaten)) : null,
    avgProtein: enough ? mean(recent.map((d) => d.protein)) : null,
    avgNetKcal,
    kgPerWeek,
    target: targetProgress(profile, startKg, currentKg, kgPerWeek, today),
    path,
    weeks: weeksOf(days, today),
  };
}
