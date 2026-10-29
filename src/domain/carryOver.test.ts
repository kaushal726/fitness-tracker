import { describe, expect, it } from "vitest";
import type { Entry } from "../data/types.ts";
import { addDays } from "../lib/dates.ts";
import { ZERO_TOTALS } from "../nutrition/constants.ts";
import type { MealType } from "../nutrition/types.ts";
import { carryOvers, HISTORY_DAYS, MIN_CHANCE, NEXT_DAY_WORTH, SAME_DAY_WORTH } from "./carryOver.ts";
import { foodsInMeal } from "./usuals.ts";

const TODAY = "2026-10-21";
let counter = 0;

function log(daysAgo: number, meal: MealType, foodId: string, quantity = 1, unit = "katori"): Entry {
  counter += 1;
  return { id: `e${counter}`, date: addDays(TODAY, -daysAgo), at: counter, meal, foodId, name: foodId, quantity, unit, portionText: "", grams: 100, nutrition: ZERO_TOTALS };
}
const onDays = (days: number[], meal: MealType, foodId: string, quantity = 1, unit = "katori"): Entry[] => days.map((d) => log(d, meal, foodId, quantity, unit));

/** A dish cooked once is likely to come back; a drink is not. */
const PRIORS: Record<string, number> = { dal: 0.45, rice: 0.45, tea: 0.08 };
const carries = (entries: Entry[], meal: MealType) => carryOvers({ entries, meal, date: TODAY, priorOf: (id) => PRIORS[id] ?? 0.12 });
const ids = (entries: Entry[], meal: MealType): string[] => carries(entries, meal).map((c) => c.foodId);
const range = (from: number, to: number): number[] => Array.from({ length: to - from + 1 }, (_, i) => from + i);

describe("carryOvers: eaten earlier today", () => {
  it("brings back a dish cooked once, on the guess for its kind when there is no history", () => {
    const [carry] = carries([log(0, "breakfast", "dal", 1.5, "bowl")], "lunch");
    expect(carry).toMatchObject({ foodId: "dal", kind: "earlier", from: "breakfast", portion: { quantity: 1.5, unit: "bowl" } });
    expect(carry.chance).toBeCloseTo(0.45, 6);
    expect(carry.score).toBeCloseTo(SAME_DAY_WORTH * 0.45, 6);
  });

  it("leaves out a food whose kind says it rarely comes back", () => {
    expect(ids([log(0, "breakfast", "tea")], "lunch")).toEqual([]);
  });

  it("learns from this person's own days: tea twice a day is brought back, a dal never eaten twice is not", () => {
    const tea = [...onDays(range(1, 6), "breakfast", "tea"), ...onDays(range(1, 6), "snack", "tea"), log(0, "breakfast", "tea")];
    expect(carries(tea, "snack")[0]?.chance).toBeGreaterThan(0.6);
    const dal = [...onDays(range(1, 10), "breakfast", "dal"), log(0, "breakfast", "dal")];
    expect(ids(dal, "lunch")).toEqual([]);
  });

  it("learns the meal too: a dal eaten at lunch is not brought to a snack that never has it", () => {
    const days = [...onDays(range(1, 8), "lunch", "dal"), ...onDays(range(1, 8), "dinner", "dal"), log(0, "lunch", "dal")];
    expect(carries(days, "dinner")[0]?.chance).toBeGreaterThan(0.7);
    expect(ids(days, "snack")).toEqual([]);
  });

  it("does not offer what is already in this meal", () => {
    expect(ids([log(0, "breakfast", "dal"), log(0, "lunch", "dal")], "lunch")).toEqual([]);
  });

  it("offers the amount from the latest time it was had today", () => {
    const [carry] = carries([log(0, "breakfast", "dal", 1), log(0, "snack", "dal", 2)], "dinner");
    expect(carry.portion).toEqual({ quantity: 2, unit: "katori" });
    expect(carry.from).toBe("snack");
  });

  it("counts for less the further apart the two meals are", () => {
    const entries = [log(0, "breakfast", "dal")];
    const at = (meal: MealType) => carries(entries, meal)[0].score;
    expect(at("lunch")).toBeGreaterThan(at("snack"));
    expect(at("snack")).toBeGreaterThan(at("dinner"));
  });

  it("only listens to the latest days", () => {
    const old = [...onDays(range(HISTORY_DAYS + 5, HISTORY_DAYS + 25), "breakfast", "dal"), ...onDays(range(HISTORY_DAYS + 5, HISTORY_DAYS + 25), "lunch", "dal")];
    expect(carries([...old, log(0, "breakfast", "dal")], "lunch")[0].chance).toBeCloseTo(0.45, 6);
  });
});

describe("carryOvers: eaten yesterday", () => {
  it("offers what was left from last night to someone who eats leftovers", () => {
    const history = [...onDays(range(1, 9), "dinner", "dal"), ...onDays(range(1, 8), "lunch", "dal")];
    const carry = carries(history, "lunch").find((c) => c.kind === "yesterday");
    expect(carry).toMatchObject({ foodId: "dal", from: "dinner" });
    expect(carry!.chance).toBeGreaterThan(0.7);
    expect(carry!.score).toBeLessThanOrEqual(NEXT_DAY_WORTH);
  });

  it("does not, on a guess alone: leftovers are rarer than a second helping the same day", () => {
    expect(ids([log(1, "dinner", "dal")], "lunch")).toEqual([]);
  });

  it("does not call yesterday's same meal a leftover: that is the routine", () => {
    const history = [...onDays(range(1, 9), "breakfast", "dal")];
    expect(ids(history, "breakfast")).toEqual([]);
  });

  it("offers a food once when it was eaten yesterday and earlier today", () => {
    const history = [log(1, "dinner", "dal"), log(0, "breakfast", "dal")];
    const found = carries(history, "lunch");
    expect(found).toHaveLength(1);
    expect(found[0].kind).toBe("earlier");
  });

  it("calls it today's, in today's amount, even when yesterday is the stronger sign; it is ranked on the stronger", () => {
    // Dal at lunch after dal at dinner, every time; and this morning's breakfast had it too.
    const history = [...onDays(range(1, 9), "dinner", "dal"), ...onDays(range(1, 8), "lunch", "dal"), log(0, "breakfast", "dal", 2, "bowl")];
    const [found] = carries(history, "lunch");
    expect(found).toMatchObject({ foodId: "dal", kind: "earlier", from: "breakfast", portion: { quantity: 2, unit: "bowl" } });
    expect(found.score).toBeGreaterThan(SAME_DAY_WORTH * 0.45);
  });
});

describe("carryOvers: whatever the history", () => {
  it("keeps its promises over many generated histories", () => {
    let seed = 20261021;
    const random = (): number => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const pick = <T,>(list: readonly T[]): T => list[Math.floor(random() * list.length)];
    const meals: MealType[] = ["breakfast", "lunch", "snack", "dinner"];
    const foods = Array.from({ length: 12 }, (_, i) => `food${i}`);
    const entries: Entry[] = [];
    for (let i = 0; i < 500; i++) entries.push(log(Math.floor(random() * 100), pick(meals), pick(foods), pick([1, 2]), pick(["piece", "katori"])));

    for (let run = 0; run < 60; run++) {
      const meal = pick(meals);
      const result = carries(entries, meal);
      const inMeal = foodsInMeal(entries, meal, TODAY);
      expect(new Set(result.map((c) => c.foodId)).size).toBe(result.length);
      for (let i = 1; i < result.length; i++) expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
      for (const c of result) {
        expect(inMeal.has(c.foodId)).toBe(false);
        expect(c.chance).toBeGreaterThanOrEqual(MIN_CHANCE);
        expect(c.chance).toBeLessThanOrEqual(1);
        expect(c.score).toBeLessThanOrEqual(Math.max(SAME_DAY_WORTH, NEXT_DAY_WORTH));
        const day = c.kind === "earlier" ? TODAY : addDays(TODAY, -1);
        expect(entries.some((e) => e.date === day && e.foodId === c.foodId && e.meal === c.from && e.meal !== meal)).toBe(true);
      }
    }
  });
});
