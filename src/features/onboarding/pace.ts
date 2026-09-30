import type { Plan } from "../../domain/goals.ts";

export interface PaceSentence {
  text: string;
  /** True only when the safe pace takes clearly longer than the person asked for. */
  warn: boolean;
}

const NEGLIGIBLE_KG_PER_WEEK = 0.05;
/** A safe pace that takes at most this much longer than asked for is not worth a warning. */
const NOTICEABLY_LONGER = 1.15;

/**
 * One plain sentence about how fast the plan moves. Null when the plan is about holding steady.
 * `requestedWeeks` is what the person asked for, so a small difference is not made to sound alarming.
 */
export function paceSentence(plan: Plan, requestedWeeks?: number | null): PaceSentence | null {
  const perWeek = Math.abs(plan.weeklyChangeKg);
  if (perWeek < NEGLIGIBLE_KG_PER_WEEK) return null;
  const verb = plan.weeklyChangeKg < 0 ? "lose" : "gain";
  const rate = `${perWeek.toFixed(2).replace(/0$/, "")} kg a week`;
  if (plan.adjusted && plan.estimatedWeeks) {
    const warn = requestedWeeks ? plan.estimatedWeeks > requestedWeeks * NOTICEABLY_LONGER : true;
    return { warn, text: `A safe pace for you is about ${rate}, so this takes about ${plan.estimatedWeeks} weeks.` };
  }
  return { warn: false, text: `You would ${verb} about ${rate}.` };
}
