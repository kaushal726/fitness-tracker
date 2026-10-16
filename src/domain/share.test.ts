import { describe, expect, it } from "vitest";
import type { Profile } from "../data/types.ts";
import { entry } from "../test/entries.ts";
import { dayReport } from "./dayReport.ts";
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

  it("survives being written out and read back", () => {
    expect(JSON.parse(JSON.stringify(x))).toEqual(x);
  });
});
