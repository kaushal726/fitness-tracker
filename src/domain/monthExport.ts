/* A month of food as one plain JSON document, for pasting or attaching to an AI chat: what was eaten, day by day, and
 * the goals and body numbers it should be read against. It leaves the person's name out.
 */
import type { Entry, Profile } from "../data/types.ts";
import { MEAL_ORDER } from "./meals.ts";
import { bmi } from "./bmi.ts";
import { bodyProgress } from "./bodyProgress.ts";
import { topFoods } from "./breakdowns.ts";
import { calorieFloor, goalDef, KCAL_PER_KG, type Plan } from "./goals.ts";
import { monthOf, type MonthId } from "./month.ts";
import { isCounted, monthInsights } from "./monthInsights.ts";

export const EXPORT_FORMAT = "eatright-month-v1";
const TOP_FOODS = 10;

const ABOUT =
  "A food log from EatRight, a personal calorie tracker, for one month. Calories are kcal, protein, carbs, fat, fiber and sugar are grams, sodium is mg. " +
  "Nutrition values are estimates from a food database, not measurements. 'counted' days are finished days with a mostly complete log; the rest are left out of averages and the balance. " +
  "balanceVsGoalKcal is the goal minus what was eaten over the counted days: positive means under the goal. " +
  `Body weight change is estimated from food against energy use, about ${KCAL_PER_KG} kcal to a kilogram, and is not a weigh-in.`;

const r0 = (n: number): number => Math.round(n);
const r1 = (n: number): number => Math.round(n * 10) / 10;
const clock = (ms: number): string => `${String(new Date(ms).getHours()).padStart(2, "0")}:${String(new Date(ms).getMinutes()).padStart(2, "0")}`;

interface Nutrients {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  sodiumMg: number;
}

const nutrients = (n: { calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sodium: number }): Nutrients => ({
  kcal: r0(n.calories),
  proteinG: r1(n.protein),
  carbsG: r1(n.carbs),
  fatG: r1(n.fat),
  fiberG: r1(n.fiber),
  sugarG: r1(n.sugar),
  sodiumMg: r0(n.sodium),
});

export interface MonthExport {
  format: typeof EXPORT_FORMAT;
  about: string;
  /** False when the person chose to share totals only: no food names, no entries. */
  foodsIncluded: boolean;
  generatedAt: string;
  month: MonthId;
  person: { age: number; gender: string; heightCm: number; weightKg: number; weightEnteredOn: string | null; bmiAtEnteredWeight: number; activity: string };
  goal: { type: string; label: string; targetWeightKg: number | null; plannedWeeks: number | null };
  dailyTargets: { kcal: number; proteinG: number; carbsG: number; fatG: number; fiberG: number };
  energy: { restingKcal: number; totalUseKcal: number };
  summary: {
    daysInMonth: number;
    daysLogged: number;
    daysCounted: number;
    daysOverGoal: number;
    monthGoalKcal: number;
    eatenKcal: number;
    balanceVsGoalKcal: number;
    averageCountedDay: Nutrients | null;
    topFoodsByCalories: { food: string; times: number; kcal: number }[];
  };
  body: { estimatedChangeKgSinceWeighIn: number; estimatedWeightNowKg: number; estimatedKgPerWeek: number | null; targetReachedAround: string | null };
  days: ({ date: string; logged: boolean; counted: boolean; meals: Record<string, number> } & Nutrients)[];
  entries: ({ date: string; time: string; meal: string; food: string; portion: string; grams: number } & Nutrients)[];
}

interface Input {
  profile: Profile;
  plan: Plan;
  entries: Entry[];
  month: MonthId;
  today: string;
  now: Date;
  /** Defaults to true. False leaves out every food: the entries and the top foods. */
  includeFoods?: boolean;
}

export function monthExport({ profile, plan, entries, month, today, now, includeFoods = true }: Input): MonthExport {
  const goal = goalDef(profile.goal);
  const insights = monthInsights({ entries, goal: plan.targets.calories, floor: calorieFloor(profile.gender), month, today });
  const progress = bodyProgress({ entries, profile, tdee: plan.tdee, goalCalories: plan.targets.calories, today });
  const own = entries.filter((e) => monthOf(e.date) === month).sort((a, b) => a.at - b.at);
  const eta = progress.target?.status === "heading" ? progress.target.etaDate : null;

  const mealKcal = new Map<string, Record<string, number>>();
  for (const e of own) {
    const day = mealKcal.get(e.date) ?? {};
    day[e.meal] = r0((day[e.meal] ?? 0) + e.nutrition.calories);
    mealKcal.set(e.date, day);
  }

  return {
    format: EXPORT_FORMAT,
    about: includeFoods ? ABOUT : `${ABOUT} Food names were left out at the person's request, so only totals are here.`,
    foodsIncluded: includeFoods,
    generatedAt: now.toISOString(),
    month,
    person: { age: profile.age, gender: profile.gender, heightCm: profile.heightCm, weightKg: profile.weightKg, weightEnteredOn: profile.weightDate ?? null, bmiAtEnteredWeight: r1(bmi(profile.weightKg, profile.heightCm)), activity: profile.activity },
    goal: { type: profile.goal, label: goal.label, targetWeightKg: profile.targetWeightKg, plannedWeeks: profile.weeks },
    dailyTargets: { kcal: plan.targets.calories, proteinG: plan.targets.protein, carbsG: plan.targets.carbs, fatG: plan.targets.fat, fiberG: plan.targets.fiber },
    energy: { restingKcal: plan.bmr, totalUseKcal: plan.tdee },
    summary: {
      daysInMonth: insights.days.length,
      daysLogged: insights.loggedDays,
      daysCounted: insights.countedDays,
      daysOverGoal: insights.overDays,
      monthGoalKcal: insights.monthGoal,
      eatenKcal: r0(insights.eaten),
      balanceVsGoalKcal: r0(insights.balance),
      averageCountedDay: insights.average ? nutrients(insights.average) : null,
      topFoodsByCalories: !includeFoods ? [] : topFoods(entries, month, TOP_FOODS).map((f) => ({ food: f.name, times: f.times, kcal: r0(f.calories) })),
    },
    body: { estimatedChangeKgSinceWeighIn: r1(progress.changeKg), estimatedWeightNowKg: r1(progress.currentKg), estimatedKgPerWeek: progress.kgPerWeek === null ? null : Math.round(progress.kgPerWeek * 100) / 100, targetReachedAround: eta },
    days: insights.days
      .filter((d) => d.phase !== "future")
      .map((d) => ({ date: d.date, logged: d.logged, counted: isCounted(d), ...nutrients(d.totals), meals: Object.fromEntries(MEAL_ORDER.filter((m) => mealKcal.get(d.date)?.[m] !== undefined).map((m) => [m, mealKcal.get(d.date)![m]])) })),
    entries: !includeFoods ? [] : own.map((e) => ({ date: e.date, time: clock(e.at), meal: e.meal, food: e.name, portion: e.portionText, grams: r0(e.grams), ...nutrients(e.nutrition) })),
  };
}

/** The file name a month's report is saved under. */
export const exportFileName = (month: MonthId, includeFoods = true): string => `eatright-${month}${includeFoods ? "" : "-totals"}.json`;

