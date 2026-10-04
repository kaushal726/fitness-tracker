import { describe, expect, it } from "vitest";
import { entry } from "../test/entries.ts";
import { currentStreak, longestStreak, macroShares, mealAverages, topFoods, weekdayAverages } from "./breakdowns.ts";
import { monthInsights } from "./monthInsights.ts";

const MONTH = "2026-10";
const GOAL = 2000;
const view = (entries: ReturnType<typeof entry>[], today = "2026-10-20") => monthInsights({ entries, goal: GOAL, floor: 1500, month: MONTH, today });

describe("macro shares", () => {
  it("splits the calories of the macros, 4 for protein and carbs, 9 for fat", () => {
    const s = macroShares({ protein: 100, carbs: 200, fat: 50 });
    expect(s).not.toBeNull();
    expect(s?.protein).toBeCloseTo(400 / 1650, 9);
    expect(s?.carbs).toBeCloseTo(800 / 1650, 9);
    expect(s?.fat).toBeCloseTo(450 / 1650, 9);
    expect((s?.protein ?? 0) + (s?.carbs ?? 0) + (s?.fat ?? 0)).toBeCloseTo(1, 9);
  });

  it("has nothing to split when nothing was eaten", () => {
    expect(macroShares({ protein: 0, carbs: 0, fat: 0 })).toBeNull();
  });
});

describe("meals, weekdays and foods", () => {
  const entries = [
    entry("2026-10-05", 600, { meal: "breakfast" }), entry("2026-10-05", 1400, { meal: "dinner" }), // Monday
    entry("2026-10-12", 500, { meal: "breakfast" }), entry("2026-10-12", 1700, { meal: "lunch" }), // Monday
    entry("2026-10-07", 2000, { meal: "lunch", foodId: "dal", name: "Dal" }), // Wednesday
  ];
  const m = view(entries);

  it("averages what each meal brought on a counted day", () => {
    const meals = mealAverages(entries, m.days);
    expect(meals.breakfast).toBeCloseTo((600 + 500) / 3, 6);
    expect(meals.lunch).toBeCloseTo((1700 + 2000) / 3, 6);
    expect(meals.snack).toBe(0);
    expect(meals.dinner).toBeCloseTo(1400 / 3, 6);
  });

  it("averages calories by weekday, Monday first, leaving empty weekdays null", () => {
    const week = weekdayAverages(m.days);
    expect(week).toHaveLength(7);
    expect(week[0]).toEqual({ weekday: 0, average: (2000 + 2200) / 2, count: 2 });
    expect(week[2]?.average).toBe(2000);
    expect(week[1]?.average).toBeNull();
  });

  it("ranks foods by the calories they supplied", () => {
    const top = topFoods(entries, MONTH, 5);
    expect(top[0]).toMatchObject({ foodId: "roti", calories: 4200, times: 4 });
    expect(top[1]).toMatchObject({ foodId: "dal", calories: 2000, times: 1 });
    expect(topFoods(entries, "2026-09", 5)).toEqual([]);
    expect(topFoods(entries, MONTH, 1)).toHaveLength(1);
  });
});

describe("streaks", () => {
  it("counts back from today, or from yesterday while today is empty", () => {
    const dates = new Set(["2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20"]);
    expect(currentStreak(dates, "2026-10-20")).toBe(4);
    expect(currentStreak(dates, "2026-10-21")).toBe(4);
    expect(currentStreak(dates, "2026-10-22")).toBe(0);
    expect(currentStreak(new Set(), "2026-10-20")).toBe(0);
  });

  it("runs across the end of a month", () => {
    expect(currentStreak(new Set(["2026-09-29", "2026-09-30", "2026-10-01"]), "2026-10-01")).toBe(3);
  });

  it("finds the longest run inside the month", () => {
    const m = view([entry("2026-10-02", 1800), entry("2026-10-03", 1800), entry("2026-10-04", 1800), entry("2026-10-08", 1800), entry("2026-10-09", 1800)]);
    expect(longestStreak(m.days)).toBe(3);
    expect(longestStreak(view([]).days)).toBe(0);
  });
});
