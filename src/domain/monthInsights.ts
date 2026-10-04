/* How a month is going against its calorie goal, and what is left to manage.
 *
 * The month's budget is the daily goal for every day of it. Days already finished are compared with the goal and the
 * difference is the balance: calories under it (banked) or over it (owed). The balance is spread over the days still to
 * come, so a heavy day can be made up for on the others. Two kinds of day are left out of the balance and the averages,
 * because they would only mislead: a day nothing was logged on (it is not known), and a day with so little logged that
 * it is more likely half-logged than real.
 */
import type { Entry } from "../data/types.ts";
import { ZERO_TOTALS } from "../nutrition/constants.ts";
import { addTotals, averageTotals } from "../nutrition/math.ts";
import type { NutritionTotals } from "../nutrition/types.ts";
import { monthDates, monthOf, type MonthId } from "./month.ts";

/** A day counts as over its goal when it passes it by this much, as the week chart on History draws it. */
export const OVER_DAY_SHARE = 1.05;
/** Below this share of the goal a logged day is taken as half-logged. */
export const PARTIAL_DAY_SHARE = 0.4;
/** However much is owed or banked, no day is asked to swing further than this from the goal. */
const MAX_EXTRA_SHARE = 0.1;
const MAX_CUT_SHARE = 0.15;
/** Under this many kcal of difference, "capped" is just rounding. */
const CAP_TOLERANCE_KCAL = 1;

export type DayPhase = "past" | "today" | "future";
export type MonthPhase = "past" | "current" | "future";

export interface DayStat {
  date: string;
  /** 1 to 31. */
  day: number;
  phase: DayPhase;
  /** At least one entry. */
  logged: boolean;
  /** Logged, but so little that it is left out of the balance and the averages. */
  partial: boolean;
  totals: NutritionTotals;
}

export interface BalancePoint {
  /** The balance at the end of this day of the month; 0 is the start of the month. */
  day: number;
  balance: number;
}

/** What the days still to come would look like if the balance were spread evenly over them. */
export interface Rebalance {
  /** Days left, today included. */
  remainingDays: number;
  /** Calories to add (+) or take off (-) each remaining day, after the limits. */
  adjustment: number;
  /** Today's suggested calories: the goal and the adjustment. */
  allowance: number;
  /** True when the limits held the adjustment back from what the balance asked for. */
  capped: boolean;
  /** The balance day by day if each remaining day is eaten at the allowance. */
  projection: BalancePoint[];
}

export interface MonthInsights {
  month: MonthId;
  phase: MonthPhase;
  goal: number;
  monthGoal: number;
  days: DayStat[];
  /** Everything logged in the month, today and half-logged days included. */
  eaten: number;
  loggedDays: number;
  /** Finished days that make up the balance and the averages. */
  countedDays: number;
  overDays: number;
  /** Calories under (+) or over (-) the goal across the counted days. */
  balance: number;
  /** The balance after each finished day, from the first of the month. */
  series: BalancePoint[];
  /** Average of one counted day, or null before there is one. */
  average: NutritionTotals | null;
  /** Only for the month that is under way. */
  rebalance: Rebalance | null;
}

interface Input {
  entries: Entry[];
  /** Calories a day. */
  goal: number;
  /** The least a day's allowance may come to. */
  floor: number;
  month: MonthId;
  today: string;
}

export const isCounted = (d: DayStat): boolean => d.phase === "past" && d.logged && !d.partial;

function dayStats(entries: Entry[], goal: number, month: MonthId, today: string): DayStat[] {
  const byDate = new Map<string, NutritionTotals>();
  const logged = new Set<string>();
  for (const e of entries) {
    if (monthOf(e.date) !== month) continue;
    byDate.set(e.date, addTotals(byDate.get(e.date) ?? ZERO_TOTALS, e.nutrition));
    logged.add(e.date);
  }
  return monthDates(month).map((date, i) => {
    const totals = byDate.get(date) ?? ZERO_TOTALS;
    const isLogged = logged.has(date);
    return {
      date,
      day: i + 1,
      phase: date < today ? "past" : date === today ? "today" : "future",
      logged: isLogged,
      partial: isLogged && totals.calories < goal * PARTIAL_DAY_SHARE,
      totals,
    };
  });
}

function rebalance(days: DayStat[], balance: number, goal: number, floor: number): Rebalance | null {
  const todayIndex = days.findIndex((d) => d.phase === "today");
  if (todayIndex < 0) return null;
  const remainingDays = days.length - todayIndex;
  const asked = balance / remainingDays;
  const limited = Math.min(goal * MAX_EXTRA_SHARE, Math.max(-goal * MAX_CUT_SHARE, asked));
  const allowance = Math.max(Math.min(floor, goal), goal + limited);
  const adjustment = allowance - goal;
  const projection: BalancePoint[] = [{ day: todayIndex, balance }];
  for (let k = 1; k <= remainingDays; k++) projection.push({ day: todayIndex + k, balance: balance - k * adjustment });
  return { remainingDays, adjustment, allowance, capped: Math.abs(asked - adjustment) > CAP_TOLERANCE_KCAL, projection };
}

export function monthInsights({ entries, goal, floor, month, today }: Input): MonthInsights {
  const days = dayStats(entries, goal, month, today);
  const counted = days.filter(isCounted);
  const phase: MonthPhase = days.every((d) => d.phase === "past") ? "past" : days.every((d) => d.phase === "future") ? "future" : "current";

  let running = 0;
  const series: BalancePoint[] = [];
  for (const d of days) {
    if (d.phase !== "past") break;
    if (isCounted(d)) running += goal - d.totals.calories;
    series.push({ day: d.day, balance: running });
  }

  return {
    month,
    phase,
    goal,
    monthGoal: goal * days.length,
    days,
    eaten: days.reduce((s, d) => s + d.totals.calories, 0),
    loggedDays: days.filter((d) => d.logged).length,
    countedDays: counted.length,
    overDays: counted.filter((d) => d.totals.calories > goal * OVER_DAY_SHARE).length,
    balance: running,
    series,
    average: averageTotals(counted.map((d) => d.totals)),
    rebalance: phase === "current" ? rebalance(days, running, goal, floor) : null,
  };
}
