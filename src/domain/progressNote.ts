/* What the body numbers mean, in a headline and a line: how the estimated weight is moving and where that leads. */
import { formatDate } from "../lib/dates.ts";
import { formatSpan } from "../lib/duration.ts";
import { formatNumber } from "../lib/format.ts";
import type { BalanceNote } from "./balanceNote.ts";
import { FAST_KG_PER_WEEK, MIN_PACE_DAYS, STEADY_KG_PER_WEEK, type BodyProgress } from "./bodyProgress.ts";

interface Context {
  /** -1 when the aim is to lose, 0 to stay, 1 to gain. */
  direction: -1 | 0 | 1;
  /** What the body uses a day. */
  tdee: number;
  /** The plan's calorie target. */
  planCalories: number;
}

/** "83.4 kg": one decimal, no sign. */
export const formatKg = (kg: number): string => `${(Math.round(Math.abs(kg) * 10) / 10).toLocaleString("en-IN")} kg`;

const note = (tone: BalanceNote["tone"], headline: string, detail: string): BalanceNote => ({ tone, headline, detail });

export function progressNote(p: BodyProgress, { direction, tdee, planCalories }: Context): BalanceNote {
  if (p.countedDays === 0) return note("info", "Your progress starts here", "Once a day is over and logged, this shows how your weight is moving and when you would reach your goal.");
  if (p.kgPerWeek === null) return note("info", "A few more days", `With ${MIN_PACE_DAYS} logged days there is enough to show your pace.`);

  const pace = `${formatKg(p.kgPerWeek)} a week`;
  const target = p.target;
  if (target === null) {
    return Math.abs(p.kgPerWeek) < STEADY_KG_PER_WEEK
      ? note("good", "Holding steady", `You eat about what your body uses: around ${formatNumber(tdee)} kcal a day.`)
      : note(direction === 0 ? "warn" : "info", `${p.kgPerWeek < 0 ? "Losing" : "Gaining"} about ${pace}`, `You average ${formatNumber(p.avgEaten ?? 0)} kcal a day and your body uses ${formatNumber(tdee)}.`);
  }

  switch (target.status) {
    case "reached":
      return note("good", "You are at your goal weight", `The estimate is ${formatKg(p.currentKg)} against a target of ${formatKg(target.kg)}. Weigh yourself and update your weight in Profile: the estimate then starts again from the real number.`);
    case "heading": {
      const span = formatSpan(target.etaDays ?? 0);
      if (Math.abs(p.kgPerWeek) > FAST_KG_PER_WEEK) {
        return note("warn", `Quick: ${pace}`, `At this pace ${formatKg(target.kg)} is about ${span} away. That is hard to keep up, and often a sign some food is not logged.`);
      }
      return target.etaDate
        ? note("good", `About ${span} to ${formatKg(target.kg)}`, `At your average of ${pace} you would get there around ${formatDate(target.etaDate, { day: "numeric", month: "short", year: "numeric" })}.`)
        : note("warn", "A long way off", `At ${pace} it takes ${span}. A bigger daily gap brings it closer: your plan's target is ${formatNumber(planCalories)} kcal.`);
    }
    case "steady":
      return note("warn", "Not moving yet", `You eat about what your body uses (${formatNumber(tdee)} kcal). Your plan's ${formatNumber(planCalories)} kcal a day is what ${direction < 0 ? "brings the weight down" : "puts weight on"}.`);
    case "away":
      return note("warn", `Moving away from ${formatKg(target.kg)}`, `You average ${formatNumber(p.avgEaten ?? 0)} kcal and your body uses ${formatNumber(tdee)}, so the estimate is ${p.kgPerWeek > 0 ? "up" : "down"} ${pace}. Your plan's target is ${formatNumber(planCalories)} kcal a day.`);
    case "unknown":
      return note("info", "A few more days", `With ${MIN_PACE_DAYS} logged days there is enough to show your pace.`);
  }
}
