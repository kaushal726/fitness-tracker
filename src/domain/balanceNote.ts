/* What a month's balance means, in a sentence or two. The numbers come from monthInsights; the words depend on whether the
 * goal is to eat less, the same, or more, since "under" is good news in one and a shortfall in the other. */
import { formatNumber } from "../lib/format.ts";
import type { MonthInsights } from "./monthInsights.ts";

export type NoteTone = "good" | "warn" | "info";

export interface BalanceNote {
  tone: NoteTone;
  headline: string;
  detail: string;
}

/** Within this many kcal of the goal the month is simply on it. */
const SETTLED_KCAL = 50;

export function balanceNote(m: MonthInsights, direction: -1 | 0 | 1): BalanceNote {
  if (m.phase === "future") {
    return { tone: "info", headline: "This month has not started", detail: `Your budget is ${formatNumber(m.monthGoal)} kcal: ${formatNumber(m.goal)} a day.` };
  }
  if (m.countedDays === 0) {
    return m.phase === "current"
      ? { tone: "info", headline: "Your balance starts here", detail: "Once a day is over and logged, this shows whether you are under or over your goal." }
      : { tone: "info", headline: "Nothing to compare", detail: "No fully logged days in this month." };
  }

  const plan = m.rebalance;
  const amount = formatNumber(Math.abs(m.balance));
  const perDay = formatNumber(Math.abs(m.balance) / m.countedDays);
  if (Math.abs(m.balance) < SETTLED_KCAL) {
    return { tone: "good", headline: "Right on your goal", detail: plan ? `Eat about ${formatNumber(m.goal)} kcal today.` : "Over the month you stayed on your goal." };
  }

  const under = m.balance > 0;
  const aiming = direction < 0 || direction === 0;
  // Under is good news when eating less is the aim; it is a shortfall when the aim is to eat more.
  const good = under === aiming;
  const headline = under
    ? aiming ? `${amount} kcal under your goal so far` : `${amount} kcal behind your goal so far`
    : aiming ? `${amount} kcal over your goal so far` : `${amount} kcal ahead of your goal`;

  if (!plan) return { tone: good ? "good" : "warn", headline: headline.replace(" so far", ""), detail: `That is about ${perDay} kcal a day ${under ? "under" : "over"} across the logged days.` };

  const change = formatNumber(Math.abs(plan.adjustment));
  const limit = plan.capped ? " That is the most to ask of one day, so the rest carries on." : "";
  const detail = under
    ? aiming ? `Today you could have up to ${formatNumber(plan.allowance)} kcal, or keep it as a cushion.${limit}` : `About ${change} kcal more a day gets you back on plan.${limit}`
    : aiming ? `About ${change} kcal less a day brings you back by the end of the month.${limit}` : `You can ease off by about ${change} kcal a day.${limit}`;
  return { tone: good ? "good" : "warn", headline, detail };
}
