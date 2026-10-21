import { describe, expect, it } from "vitest";
import type { Entry } from "../data/types.ts";
import { addDays } from "../lib/dates.ts";
import { ZERO_TOTALS } from "../nutrition/constants.ts";
import type { MealType } from "../nutrition/types.ts";
import { foodsInMeal, MIN_SCORE, usualFoods } from "./usuals.ts";

/** A Wednesday: seven days back is a Wednesday too. */
const TODAY = "2026-10-21";
let counter = 0;

function log(daysAgo: number, meal: MealType, foodId: string, quantity = 1, unit = "serving"): Entry {
  counter += 1;
  return { id: `e${counter}`, date: addDays(TODAY, -daysAgo), at: counter, meal, foodId, name: foodId, quantity, unit, portionText: "", grams: 100, nutrition: ZERO_TOTALS };
}

/** The same food on each of these many days back. */
const onDays = (days: number[], meal: MealType, foodId: string, quantity = 1, unit = "serving"): Entry[] => days.map((d) => log(d, meal, foodId, quantity, unit));

const usual = (entries: Entry[], meal: MealType | null, date = TODAY) => usualFoods({ entries, meal, date, today: TODAY });
const ids = (entries: Entry[], meal: MealType | null, date = TODAY): string[] => usual(entries, meal, date).map((u) => u.foodId);

describe("usualFoods", () => {
  it("ranks what a meal is made of by how many days it was eaten", () => {
    const entries = [...onDays([1, 2, 3, 4, 5, 6], "breakfast", "poha"), ...onDays([2, 4, 6], "breakfast", "banana"), ...onDays([3], "breakfast", "idli")];
    expect(ids(entries, "breakfast")).toEqual(["poha", "banana", "idli"]);
  });

  it("looks only at the meal asked for, or at every meal when there is none", () => {
    const entries = [...onDays([1, 2, 3], "breakfast", "poha"), ...onDays([1, 2, 3], "lunch", "dal")];
    expect(ids(entries, "breakfast")).toEqual(["poha"]);
    expect(ids(entries, "dinner")).toEqual([]);
    expect(ids(entries, null).sort()).toEqual(["dal", "poha"]);
  });

  it("lets a habit of lately beat a bigger one from long ago", () => {
    const entries = [...onDays([200, 201, 202, 203, 204, 205], "breakfast", "old"), ...onDays([1, 2], "breakfast", "recent")];
    const ranked = ids(entries, "breakfast");
    expect(ranked[0]).toBe("recent");
    expect(ranked.indexOf("recent")).toBeLessThan(ranked.indexOf("old") === -1 ? Infinity : ranked.indexOf("old"));
  });

  it("drops a food that was eaten once, a long time ago", () => {
    expect(ids(onDays([400], "breakfast", "once"), "breakfast")).toEqual([]);
  });

  it("counts a day once, however many times the food was logged on it", () => {
    const entries = [log(1, "breakfast", "tea"), log(1, "breakfast", "tea"), log(1, "breakfast", "tea")];
    expect(usual(entries, "breakfast")[0].days).toBe(1);
  });

  it("favours a food eaten on the same weekday as the day being logged", () => {
    // Seven days ago was a Wednesday like today; six days ago was a Thursday. Everything else is equal.
    const entries = [...onDays([7], "breakfast", "wednesday"), ...onDays([6], "breakfast", "thursday")];
    expect(ids(entries, "breakfast")).toEqual(["wednesday", "thursday"]);
  });

  describe("with food already in the meal", () => {
    const history = [
      ...onDays([1, 2, 3, 4], "breakfast", "dosa"),
      ...onDays([1, 2, 3, 4], "breakfast", "coffee"),
      ...onDays([8, 9, 10, 11, 12, 13], "breakfast", "poha"),
      ...onDays([14, 15, 16, 17, 18], "breakfast", "banana"),
    ];

    it("leaves it out", () => {
      const today = [log(0, "breakfast", "poha")];
      expect(ids([...history, ...today], "breakfast")).not.toContain("poha");
      expect([...foodsInMeal([...history, ...today], "breakfast", TODAY)]).toEqual(["poha"]);
    });

    it("keeps it for the other meals, which it is not in", () => {
      expect(ids([...history, log(0, "breakfast", "poha")], null)).toContain("poha");
    });

    it("puts what usually comes with it first", () => {
      expect(ids(history, "breakfast")[0]).toBe("poha");
      expect(ids([...history, log(0, "breakfast", "dosa")], "breakfast")[0]).toBe("coffee");
    });

    it("only counts what was in the same meal, not the day", () => {
      const lunchDosa = [...history, log(0, "lunch", "dosa")];
      expect(ids(lunchDosa, "breakfast")[0]).toBe("poha");
    });
  });

  describe("the amount offered", () => {
    it("is the one logged most often", () => {
      const entries = [...onDays([2, 3, 4, 5], "lunch", "roti", 2, "roti"), ...onDays([1], "lunch", "roti", 3, "roti")];
      expect(usual(entries, "lunch")[0].portion).toEqual({ quantity: 2, unit: "roti" });
    });

    it("follows a change of habit", () => {
      const entries = [...onDays([60, 61, 62, 63], "lunch", "roti", 2, "roti"), ...onDays([1, 2, 3], "lunch", "roti", 3, "roti")];
      expect(usual(entries, "lunch")[0].portion).toEqual({ quantity: 3, unit: "roti" });
    });

    it("goes to the latest when two amounts are equally common", () => {
      // One day of each: they differ only in how long ago they were, so the later day decides.
      const entries = [log(3, "lunch", "rice", 1, "katori"), log(2, "lunch", "rice", 2, "katori")];
      expect(usual(entries, "lunch")[0].portion).toEqual({ quantity: 2, unit: "katori" });
    });
  });

  it("holds its invariants over many generated histories", () => {
    let seed = 20261021;
    const random = (): number => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const pick = <T,>(list: readonly T[]): T => list[Math.floor(random() * list.length)];
    const meals: MealType[] = ["breakfast", "lunch", "snack", "dinner"];
    const foods = Array.from({ length: 15 }, (_, i) => `food${i}`);
    const entries: Entry[] = [];
    for (let i = 0; i < 400; i++) entries.push(log(Math.floor(random() * 120), pick(meals), pick(foods), pick([1, 2, 3]), pick(["piece", "katori"])));

    for (let run = 0; run < 60; run++) {
      const meal = random() < 0.2 ? null : pick(meals);
      const date = addDays(TODAY, -Math.floor(random() * 10));
      const result = usual(entries, meal, date);

      expect(new Set(result.map((u) => u.foodId)).size).toBe(result.length);
      for (let i = 1; i < result.length; i++) expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
      const inMeal = meal === null ? new Set<string>() : foodsInMeal(entries, meal, date);
      for (const u of result) {
        expect(inMeal.has(u.foodId)).toBe(false);
        expect(u.score).toBeGreaterThanOrEqual(MIN_SCORE);
        const own = entries.filter((e) => e.foodId === u.foodId && (meal === null || e.meal === meal));
        expect(own.length).toBeGreaterThan(0);
        expect(u.days).toBe(new Set(own.map((e) => e.date)).size);
        expect(own.some((e) => e.quantity === u.portion.quantity && e.unit === u.portion.unit)).toBe(true);
      }
    }
  });
});
