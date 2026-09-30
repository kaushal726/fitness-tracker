/* Daily calorie and macro targets from a few body facts and a goal.
 *
 * Mifflin-St Jeor for resting energy, an activity multiplier for the day's total, then a deficit
 * or surplus. When a target weight and timeline are given the deficit comes from them
 * (about 7700 kcal per kg), but it is held to a safe pace; the plan then says how long the safe
 * pace really takes instead of quietly promising the fast one.
 */
import type { ActivityId, Gender, GoalId, Profile, Targets } from "../data/types.ts";
import { isValidWeeks } from "./timeline.ts";

export const KCAL_PER_KG = 7700;
const DAYS_PER_WEEK = 7;
const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;

const MIN_CALORIES: Record<Gender, number> = { female: 1200, male: 1500 };
const MAX_DEFICIT_KCAL = 1000;
const MAX_DEFICIT_SHARE = 0.25;
const MAX_SURPLUS_KCAL = 700;
const FAT_SHARE = 0.25;
const MAX_PROTEIN_SHARE = 0.4;
const FIBER_G_PER_1000_KCAL = 14;
const MIN_FIBER_G = 25;
const ROUND_CALORIES_TO = 10;
const MIN_CUSTOM_CALORIES = 800;
const MAX_CUSTOM_CALORIES = 6000;
/** Below this many kcal of difference, "adjusted" is just rounding. */
const ADJUSTED_TOLERANCE_KCAL = 15;

export interface GoalDef {
  id: GoalId;
  label: string;
  hint: string;
  /** -1 lose, 0 keep, 1 gain. */
  direction: -1 | 0 | 1;
  proteinPerKg: number;
  /** Share of daily energy used as deficit/surplus when no target weight and timeline are given. */
  defaultShare: number;
}

export const GOALS: GoalDef[] = [
  { id: "lose_fat", label: "Lose fat", hint: "Lean out and keep your muscle", direction: -1, proteinPerKg: 2, defaultShare: 0.2 },
  { id: "lose_weight", label: "Lose weight", hint: "Bring the scale down", direction: -1, proteinPerKg: 1.6, defaultShare: 0.2 },
  { id: "maintain", label: "Maintain weight", hint: "Stay where you are", direction: 0, proteinPerKg: 1.4, defaultShare: 0 },
  { id: "gain_muscle", label: "Gain muscle", hint: "Build with a small surplus", direction: 1, proteinPerKg: 2, defaultShare: 0.1 },
  { id: "gain_weight", label: "Gain weight", hint: "Eat more, add mass", direction: 1, proteinPerKg: 1.6, defaultShare: 0.15 },
];

export const ACTIVITY_LEVELS: { id: ActivityId; label: string; hint: string; multiplier: number }[] = [
  { id: "sedentary", label: "Mostly sitting", hint: "Desk job, little exercise", multiplier: 1.2 },
  { id: "light", label: "Lightly active", hint: "Exercise 1-3 days a week", multiplier: 1.375 },
  { id: "moderate", label: "Moderately active", hint: "Exercise 3-5 days a week", multiplier: 1.55 },
  { id: "active", label: "Very active", hint: "Hard training 6-7 days a week", multiplier: 1.725 },
  { id: "athlete", label: "Athlete", hint: "Twice a day or a physical job", multiplier: 1.9 },
];

export interface Plan {
  bmr: number;
  tdee: number;
  targets: Targets;
  /** Calories minus what the body uses: negative when losing. */
  dailyChangeKcal: number;
  weeklyChangeKg: number;
  /** Weeks to reach the target weight at this pace; null when there is no target. */
  estimatedWeeks: number | null;
  /** True when the requested pace was too aggressive and a safer one was used. */
  adjusted: boolean;
  /** True when a hand-set calorie target replaced the calculated one. */
  custom: boolean;
}

export function goalDef(id: GoalId): GoalDef {
  return GOALS.find((g) => g.id === id) ?? GOALS[2];
}

export function bmr(p: Pick<Profile, "gender" | "weightKg" | "heightCm" | "age">): number {
  return 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.gender === "male" ? 5 : -161);
}

export function activityMultiplier(id: ActivityId): number {
  return ACTIVITY_LEVELS.find((a) => a.id === id)?.multiplier ?? ACTIVITY_LEVELS[0].multiplier;
}

/**
 * Rounds to the nearest 10 without stepping outside the safe pace (up when losing, down when gaining),
 * and without landing on the wrong side of what the body uses.
 */
function roundCalories(kcal: number, direction: GoalDef["direction"], tdee: number): number {
  const steps = (value: number) => value / ROUND_CALORIES_TO;
  if (direction < 0) return Math.min(Math.ceil(steps(kcal)), Math.floor(steps(tdee))) * ROUND_CALORIES_TO;
  if (direction > 0) return Math.max(Math.floor(steps(kcal)), Math.ceil(steps(tdee))) * ROUND_CALORIES_TO;
  return Math.round(steps(kcal)) * ROUND_CALORIES_TO;
}

function macrosFor(calories: number, weightKg: number, proteinPerKg: number): Omit<Targets, "calories"> {
  const protein = Math.min(proteinPerKg * weightKg, (calories * MAX_PROTEIN_SHARE) / KCAL_PER_G.protein);
  const fat = (calories * FAT_SHARE) / KCAL_PER_G.fat;
  const carbs = Math.max(0, (calories - protein * KCAL_PER_G.protein - fat * KCAL_PER_G.fat) / KCAL_PER_G.carbs);
  return {
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
    fiber: Math.max(MIN_FIBER_G, Math.round((calories / 1000) * FIBER_G_PER_1000_KCAL)),
  };
}

/** Requested daily change in kcal (always positive) for a weight-changing goal. */
function requestedChange(profile: Profile, tdee: number, goal: GoalDef): number {
  const { targetWeightKg, weeks } = profile;
  if (targetWeightKg && weeks) return (Math.abs(targetWeightKg - profile.weightKg) * KCAL_PER_KG) / (weeks * DAYS_PER_WEEK);
  return tdee * goal.defaultShare;
}

export function computePlan(profile: Profile, customCalories: number | null = null): Plan {
  const goal = goalDef(profile.goal);
  const restingEnergy = bmr(profile);
  const tdee = restingEnergy * activityMultiplier(profile.activity);
  const floor = MIN_CALORIES[profile.gender];

  let calories = tdee;
  let adjusted = false;
  if (goal.direction !== 0) {
    const wanted = requestedChange(profile, tdee, goal);
    if (goal.direction < 0) {
      const safe = Math.min(wanted, MAX_DEFICIT_KCAL, tdee * MAX_DEFICIT_SHARE);
      calories = Math.max(tdee - safe, Math.min(floor, tdee));
      adjusted = wanted - (tdee - calories) > ADJUSTED_TOLERANCE_KCAL;
    } else {
      calories = tdee + Math.min(wanted, MAX_SURPLUS_KCAL);
      adjusted = wanted - (calories - tdee) > ADJUSTED_TOLERANCE_KCAL;
    }
  }

  const custom = customCalories !== null;
  calories = custom
    ? Math.min(MAX_CUSTOM_CALORIES, Math.max(MIN_CUSTOM_CALORIES, Math.round(customCalories)))
    : roundCalories(calories, goal.direction, tdee);

  const dailyChangeKcal = calories - tdee;
  const weeklyChangeKg = (dailyChangeKcal * DAYS_PER_WEEK) / KCAL_PER_KG;
  const toTarget = profile.targetWeightKg === null ? null : profile.targetWeightKg - profile.weightKg;
  const movingTowardTarget = toTarget !== null && toTarget !== 0 && Math.sign(toTarget) === Math.sign(weeklyChangeKg);
  const estimatedWeeks = goal.direction === 0 || toTarget === null || !movingTowardTarget ? null : Math.max(1, Math.round(Math.abs(toTarget / weeklyChangeKg)));

  return {
    bmr: Math.round(restingEnergy),
    tdee: Math.round(tdee),
    targets: { calories, ...macrosFor(calories, profile.weightKg, goal.proteinPerKg) },
    dailyChangeKcal: Math.round(dailyChangeKcal),
    weeklyChangeKg: Math.round(weeklyChangeKg * 100) / 100,
    estimatedWeeks,
    adjusted: adjusted && !custom,
    custom,
  };
}

export interface ProfileIssue {
  field: "age" | "heightCm" | "weightKg" | "targetWeightKg" | "weeks";
  message: string;
}

/** The ranges a person can plausibly answer with. Shown as hints, enforced by profileIssues. */
export const PROFILE_LIMITS = { age: [10, 100], heightCm: [100, 250], weightKg: [25, 300] } as const;
const OUT_OF_RANGE = "Enter a value in the usual range";

export function profileIssues(p: {
  age: number;
  heightCm: number;
  weightKg: number;
  goal: GoalId;
  targetWeightKg: number | null;
  /** Only checked for goals that change weight. */
  weeks?: number | null;
}): ProfileIssue[] {
  const issues: ProfileIssue[] = [];
  for (const field of ["age", "heightCm", "weightKg"] as const) {
    const [min, max] = PROFILE_LIMITS[field];
    if (!(p[field] >= min && p[field] <= max)) issues.push({ field, message: OUT_OF_RANGE });
  }
  const direction = goalDef(p.goal).direction;
  if (direction !== 0) {
    const [min, max] = PROFILE_LIMITS.weightKg;
    if (p.targetWeightKg === null || !(p.targetWeightKg >= min && p.targetWeightKg <= max)) issues.push({ field: "targetWeightKg", message: OUT_OF_RANGE });
    else if (Math.sign(p.targetWeightKg - p.weightKg) !== direction) issues.push({ field: "targetWeightKg", message: direction < 0 ? "Should be lower than your weight" : "Should be higher than your weight" });
    if (p.weeks !== undefined && (p.weeks === null || !isValidWeeks(p.weeks))) issues.push({ field: "weeks", message: OUT_OF_RANGE });
  }
  return issues;
}
