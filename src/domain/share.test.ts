import { describe, expect, it } from "vitest";
import type { Profile } from "../data/types.ts";
import { entry } from "../test/entries.ts";
import { calorieBalance, dayReport, energySplit } from "./dayReport.ts";
import { computePlan } from "./goals.ts";
import { EXPORT_FORMAT, exportFileName, monthExport } from "./monthExport.ts";

const profile: Profile = { name: "Secret Name", age: 30, gender: "male", heightCm: 175, weightKg: 85, goal: "lose_fat", targetWeightKg: 75, weeks: 20, activity: "light", weightDate: "2026-09-30", startWeightKg: 85 };
const plan = computePlan(profile);
const TODAY = "2026-10-06";
const entries = [
  entry("2026-10-01", 600, { meal: "breakfast", name: "Poha", portionText: "1 katori", foodId: "poha" }),
  entry("2026-10-01", 1400, { meal: "lunch", name: "Rice", portionText: "2 katori", foodId: "steamed_rice" }),
  entry("2026-10-02", 1900, { meal: "dinner", name: "Roti", portionText: "3 roti", foodId: "roti" }),
  entry("2026-10-06", 450, { meal: "breakfast", name: "Poha", portionText: "1 katori", foodId: "poha" }),
  entry("2026-10-06", 250, { meal: "snack", name: "Tea", portionText: "1 cup", foodId: "milk_tea" }),
  entry("2026-09-20", 1800, { meal: "lunch", name: "Dal", portionText: "1 katori", foodId: "dal_tadka" }),
];

describe("dayReport", () => {
  const r = dayReport(entries, plan.targets, TODAY);

  it("totals the day and lists only the meals that have food, in order", () => {
    expect(r.totals.calories).toBe(700);
    expect(r.itemCount).toBe(2);
    expect(r.meals.map((m) => m.meal)).toEqual(["breakfast", "snack"]);
    expect(r.meals[0]).toMatchObject({ label: "Breakfast", calories: 450, items: [{ name: "Poha", portion: "1 katori", calories: 450 }] });
    expect(r.meals.reduce((s, m) => s + m.calories, 0)).toBe(r.totals.calories);
  });

  it("gives each meal its macros and when it started, and the day its energy split", () => {
    const [breakfast] = r.meals;
    expect(breakfast.protein).toBeCloseTo(18);
    expect(breakfast.carbs).toBeCloseTo(45);
    expect(breakfast.fat).toBeCloseTo(13.5);
    expect(breakfast.at).toBe(entries[3].at);
    expect(breakfast.items[0].protein).toBeCloseTo(18);
    expect(Object.values(r.energySplit).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("is empty for a day with nothing logged", () => {
    expect(dayReport(entries, plan.targets, "2026-10-04")).toMatchObject({ itemCount: 0, meals: [], totals: { calories: 0 } });
  });
});

describe("monthExport", () => {
  const x = monthExport({ profile, plan, entries, month: "2026-10", today: TODAY, now: new Date("2026-10-06T10:30:00Z") });

  it("describes itself and leaves the name out", () => {
    expect(x.format).toBe(EXPORT_FORMAT);
    expect(x.about).toContain("kcal");
    expect(JSON.stringify(x)).not.toContain("Secret Name");
    expect(exportFileName("2026-10")).toBe("eatright-2026-10.json");
  });

  it("carries the goals and body numbers it is to be read against", () => {
    expect(x.dailyTargets.kcal).toBe(plan.targets.calories);
    expect(x.energy).toEqual({ restingKcal: plan.bmr, totalUseKcal: plan.tdee });
    expect(x.goal).toMatchObject({ type: "lose_fat", targetWeightKg: 75, plannedWeeks: 20 });
    expect(x.person).toMatchObject({ age: 30, heightCm: 175, weightKg: 85, weightEnteredOn: "2026-09-30" });
  });

  it("lists this month's entries only, and they add up to the days and the month", () => {
    expect(x.entries).toHaveLength(5);
    expect(x.entries.every((e) => e.date.startsWith("2026-10"))).toBe(true);
    expect(x.summary.eatenKcal).toBe(600 + 1400 + 1900 + 450 + 250);
    for (const d of x.days) expect(d.kcal).toBe(x.entries.filter((e) => e.date === d.date).reduce((s, e) => s + e.kcal, 0));
    expect(x.days.map((d) => d.date)).toEqual(["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06"]);
    expect(x.days[0]).toMatchObject({ logged: true, counted: true, meals: { breakfast: 600, lunch: 1400 } });
    expect(x.days[2]).toMatchObject({ logged: false, counted: false, kcal: 0, meals: {} });
    expect(x.summary).toMatchObject({ daysLogged: 3, daysCounted: 2, daysInMonth: 31 });
  });

  it("leaves every food out when asked, and keeps the totals", () => {
    const totals = monthExport({ profile, plan, entries, month: "2026-10", today: TODAY, now: new Date("2026-10-06T10:30:00Z"), includeFoods: false });
    expect(totals.foodsIncluded).toBe(false);
    expect(totals.entries).toEqual([]);
    expect(totals.summary.topFoodsByCalories).toEqual([]);
    expect(JSON.stringify(totals)).not.toMatch(/Poha|Roti|Rice/);
    expect(totals.summary.eatenKcal).toBe(x.summary.eatenKcal);
    expect(totals.days).toEqual(x.days);
    expect(x.foodsIncluded).toBe(true);
    expect(exportFileName("2026-10", false)).toBe("eatright-2026-10-totals.json");
  });

  it("survives being written out and read back", () => {
    expect(JSON.parse(JSON.stringify(x))).toEqual(x);
  });
});

describe("energySplit", () => {
  it("adds up to 100 whatever the rounding", () => {
    for (const [protein, carbs, fat] of [[30, 100, 20], [1, 1, 1], [0, 0, 7], [55.5, 12.3, 80.1], [200, 0, 0]]) {
      const s = energySplit({ protein, carbs, fat });
      expect(s.protein + s.carbs + s.fat, `${protein}/${carbs}/${fat}`).toBe(100);
    }
  });

  it("weighs fat by its 9 kcal a gram", () => {
    expect(energySplit({ protein: 25, carbs: 25, fat: 22.22 })).toEqual({ protein: 25, carbs: 25, fat: 50 });
  });

  it("is all zero when nothing has macros", () => {
    expect(energySplit({ protein: 0, carbs: 0, fat: 0 })).toEqual({ protein: 0, carbs: 0, fat: 0 });
  });
});

describe("calorieBalance", () => {
  it("says left or over by the sign, however small the difference", () => {
    expect(calorieBalance(1200, 2000)).toEqual({ over: false, amount: 800 });
    expect(calorieBalance(2000, 2000)).toEqual({ over: false, amount: 0 });
    expect(calorieBalance(2051, 2000)).toEqual({ over: true, amount: 51 });
    expect(calorieBalance(1949, 2000)).toEqual({ over: false, amount: 51 });
    expect(calorieBalance(2200, 2000)).toEqual({ over: true, amount: 200 });
  });

  it("counts whole kcal the way the numbers are shown", () => {
    expect(calorieBalance(2000.4, 2000)).toEqual({ over: false, amount: 0 });
    expect(calorieBalance(2000.6, 2000)).toEqual({ over: true, amount: 1 });
  });
});
