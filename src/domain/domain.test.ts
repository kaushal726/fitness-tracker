import { describe, expect, it } from "vitest";
import type { Profile } from "../data/types.ts";
import { ACTIVITY_LEVELS, bmr, computePlan, GOALS, profileIssues } from "./goals.ts";
import { TIMELINE_PRESETS } from "./timeline.ts";
import { dayInsight } from "./insights.ts";
import { DEFAULT_MEAL_STARTS, isValidMealStarts, mealForTime } from "./meals.ts";

const base: Profile = { name: "", age: 30, gender: "male", heightCm: 175, weightKg: 75, goal: "maintain", targetWeightKg: null, weeks: null, activity: "moderate" };

/** Small deterministic generator so the scenarios below are the same on every run. */
function random(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe("goal calculation", () => {
  it("uses Mifflin-St Jeor", () => {
    expect(bmr(base)).toBeCloseTo(1698.75, 2);
    expect(bmr({ ...base, gender: "female" })).toBeCloseTo(1532.75, 2);
  });

  it("maintains at the day's energy use", () => {
    const plan = computePlan(base);
    expect(plan.tdee).toBe(2633);
    expect(plan.targets.calories).toBe(2630);
    expect(plan.dailyChangeKcal).toBeLessThan(5);
    expect(plan.estimatedWeeks).toBeNull();
  });

  it("turns a target weight and timeline into a deficit", () => {
    const plan = computePlan({ ...base, goal: "lose_fat", targetWeightKg: 70, weeks: 10 });
    expect(plan.targets.calories).toBe(2090);
    expect(plan.adjusted).toBe(false);
    expect(plan.weeklyChangeKg).toBeCloseTo(-0.5, 1);
    expect(plan.estimatedWeeks).toBe(10);
  });

  it("holds an unsafe pace back and says how long the safe one takes", () => {
    const plan = computePlan({ ...base, goal: "lose_weight", targetWeightKg: 45, weeks: 4 });
    expect(plan.adjusted).toBe(true);
    expect(plan.targets.calories).toBeGreaterThanOrEqual(1500);
    expect(plan.estimatedWeeks).toBeGreaterThan(4);
  });

  it("caps a gain at a modest surplus", () => {
    const plan = computePlan({ ...base, goal: "gain_muscle", targetWeightKg: 90, weeks: 4 });
    expect(plan.adjusted).toBe(true);
    expect(plan.dailyChangeKcal).toBeLessThanOrEqual(710);
  });

  it("lets a hand-set calorie target win, within sane limits", () => {
    expect(computePlan(base, 1800)).toMatchObject({ custom: true, targets: expect.objectContaining({ calories: 1800 }) });
    expect(computePlan(base, 100).targets.calories).toBe(800);
  });

  it("holds for generated people and goals", () => {
    const next = random(42);
    for (let i = 0; i < 400; i++) {
      const goal = GOALS[Math.floor(next() * GOALS.length)];
      const weightKg = 40 + Math.round(next() * 90);
      const change = goal.direction === 0 ? null : goal.direction * (2 + Math.round(next() * 25));
      const profile: Profile = {
        name: "",
        age: 16 + Math.round(next() * 60),
        gender: next() < 0.5 ? "male" : "female",
        heightCm: 145 + Math.round(next() * 50),
        weightKg,
        goal: goal.id,
        targetWeightKg: change === null ? null : weightKg + change,
        weeks: change === null ? null : TIMELINE_PRESETS.weeks[Math.floor(next() * TIMELINE_PRESETS.weeks.length)],
        activity: ACTIVITY_LEVELS[Math.floor(next() * ACTIVITY_LEVELS.length)].id,
      };
      const plan = computePlan(profile);
      const { calories, protein, carbs, fat, fiber } = plan.targets;
      const label = JSON.stringify(profile);

      // Direction: a losing goal never eats above what the body uses, a gaining goal never below.
      if (goal.direction < 0) expect(calories, label).toBeLessThanOrEqual(plan.tdee + 5);
      if (goal.direction > 0) expect(calories, label).toBeGreaterThanOrEqual(plan.tdee - 5);
      // Never below the safety floor, unless the person's own energy use is already below it.
      expect(calories, label).toBeGreaterThanOrEqual(Math.min(profile.gender === "male" ? 1500 : 1200, plan.tdee - 10));
      // Macros add back up to the calories, within rounding.
      expect(Math.abs(protein * 4 + carbs * 4 + fat * 9 - calories), label).toBeLessThanOrEqual(20);
      expect(fiber).toBeGreaterThanOrEqual(25);
      // The pace is never above the safe limits.
      expect(plan.dailyChangeKcal, label).toBeGreaterThanOrEqual(-1000);
      expect(plan.dailyChangeKcal, label).toBeLessThanOrEqual(710);
      // Never claims a duration for a target it is moving away from.
      if (plan.estimatedWeeks !== null) expect(plan.estimatedWeeks).toBeGreaterThan(0);
    }
  });

  it("checks the answers a person can get wrong", () => {
    expect(profileIssues({ age: 30, heightCm: 175, weightKg: 75, goal: "maintain", targetWeightKg: null })).toEqual([]);
    expect(profileIssues({ age: 3, heightCm: 175, weightKg: 75, goal: "maintain", targetWeightKg: null }).map((i) => i.field)).toEqual(["age"]);
    expect(profileIssues({ age: 30, heightCm: 175, weightKg: 75, goal: "lose_fat", targetWeightKg: 80 })[0]?.field).toBe("targetWeightKg");
    expect(profileIssues({ age: 30, heightCm: 175, weightKg: 75, goal: "gain_muscle", targetWeightKg: 70 })[0]?.field).toBe("targetWeightKg");
    expect(profileIssues({ age: 30, heightCm: 175, weightKg: 75, goal: "lose_fat", targetWeightKg: null })[0]?.field).toBe("targetWeightKg");
  });
});

describe("meal by time", () => {
  const at = (h: number, m = 0) => new Date(2026, 0, 5, h, m);
  it("follows the default windows", () => {
    expect(mealForTime(at(6))).toBe("breakfast");
    expect(mealForTime(at(10, 59))).toBe("breakfast");
    expect(mealForTime(at(11))).toBe("lunch");
    expect(mealForTime(at(15, 30))).toBe("lunch");
    expect(mealForTime(at(16))).toBe("snack");
    expect(mealForTime(at(18, 59))).toBe("snack");
    expect(mealForTime(at(19))).toBe("dinner");
    expect(mealForTime(at(23, 30))).toBe("dinner");
  });
  it("counts the small hours as dinner, and honours custom windows", () => {
    expect(mealForTime(at(2))).toBe("dinner");
    expect(mealForTime(at(9), { breakfast: 7, lunch: 9, snack: 15, dinner: 20 })).toBe("lunch");
  });
  it("only accepts windows that increase through the day", () => {
    expect(isValidMealStarts(DEFAULT_MEAL_STARTS)).toBe(true);
    expect(isValidMealStarts({ breakfast: 8, lunch: 8, snack: 16, dinner: 19 })).toBe(false);
    expect(isValidMealStarts({ breakfast: 8, lunch: 12, snack: 11, dinner: 19 })).toBe(false);
  });
});

describe("day insight", () => {
  const targets = { calories: 2000, protein: 120, carbs: 250, fat: 60, fiber: 30 };
  const totals = (calories: number, protein: number) => ({ calories, protein, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 });
  it("covers the four situations", () => {
    expect(dayInsight(totals(0, 0), targets, false, 9)?.tone).toBe("info");
    expect(dayInsight(totals(2400, 130), targets, true, 21)?.tone).toBe("warn");
    expect(dayInsight(totals(1500, 50), targets, true, 19)?.text).toContain("Protein");
    expect(dayInsight(totals(1950, 118), targets, true, 21)?.tone).toBe("good");
    expect(dayInsight(totals(600, 30), targets, true, 11)).toBeNull();
  });
});
