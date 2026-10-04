import { describe, expect, it } from "vitest";
import { makeFoodLookup } from "../data/selectors.ts";
import { entry } from "../test/entries.ts";
import { drinkSummary } from "./drinks.ts";
import { eatingClock, mealHabits, SODIUM_LIMIT_MG, sugarLimitG, sugarSalt } from "./habits.ts";
import { highlights } from "./highlights.ts";
import { monthInsights } from "./monthInsights.ts";

const GOAL = 2000;
const TODAY = "2026-10-06";
const lookup = makeFoodLookup([]);
const at = (date: string, hour: number) => new Date(`${date}T${String(hour).padStart(2, "0")}:15:00`).getTime();
const insights = (entries: ReturnType<typeof entry>[]) => monthInsights({ entries, goal: GOAL, floor: 1500, month: "2026-10", today: TODAY });

describe("sugar and salt", () => {
  it("averages the counted days and counts the days over each limit", () => {
    const e = [
      { ...entry("2026-10-01", 2000), nutrition: { calories: 2000, protein: 80, carbs: 250, fat: 60, fiber: 25, sugar: 70, sodium: 2600 } },
      { ...entry("2026-10-02", 2000), nutrition: { calories: 2000, protein: 80, carbs: 250, fat: 60, fiber: 25, sugar: 30, sodium: 1400 } },
      { ...entry("2026-10-03", 300), nutrition: { calories: 300, protein: 5, carbs: 40, fat: 5, fiber: 2, sugar: 999, sodium: 9999 } }, // half-logged: left out
    ];
    const r = sugarSalt(insights(e).days, GOAL);
    expect(sugarLimitG(GOAL)).toBe(50);
    expect(r).toMatchObject({ countedDays: 2, sugar: 50, sodium: 2000, sugarDaysOver: 1, sodiumDaysOver: 1 });
    expect(SODIUM_LIMIT_MG).toBe(2000);
    expect(sugarSalt(insights([]).days, GOAL)).toBeNull();
  });
});

describe("meals and the clock", () => {
  const e = [
    entry("2026-10-01", 600, { meal: "breakfast", at: at("2026-10-01", 8) }),
    entry("2026-10-01", 800, { meal: "lunch", at: at("2026-10-01", 13) }),
    entry("2026-10-01", 700, { meal: "dinner", at: at("2026-10-01", 22) }),
    entry("2026-10-02", 900, { meal: "lunch", at: at("2026-10-02", 13) }),
    entry("2026-10-02", 900, { meal: "dinner", at: at("2026-10-02", 3) }),
    entry("2026-10-02", 400, { meal: "dinner", at: at("2026-10-02", 19) }),
  ];
  const days = insights(e).days;

  it("counts the days each meal was logged on", () => {
    const habits = mealHabits(e, days);
    expect(habits.find((h) => h.meal === "breakfast")).toMatchObject({ days: 1, countedDays: 2 });
    expect(habits.find((h) => h.meal === "lunch")?.days).toBe(2);
    expect(habits.find((h) => h.meal === "snack")?.days).toBe(0);
  });

  it("splits the calories by the hour they were logged, the night wrapping past midnight", () => {
    const blocks = eatingClock(e, days);
    expect(blocks.reduce((s, b) => s + b.calories, 0)).toBe(4300);
    expect(blocks.reduce((s, b) => s + b.share, 0)).toBeCloseTo(1, 9);
    expect(blocks.find((b) => b.id === "night")?.calories).toBe(700 + 900);
    expect(blocks.find((b) => b.id === "early")?.calories).toBe(600);
    expect(blocks.find((b) => b.id === "evening")?.calories).toBe(400);
  });
});

describe("drinks", () => {
  it("counts water, cups of tea or coffee, sweet drinks and alcohol on the counted days", () => {
    const drink = (foodId: string, date: string, grams: number, kcal: number, extra = {}) => entry(date, kcal, { foodId, grams, ...extra });
    const e = [
      entry("2026-10-01", 1900),
      drink("water", "2026-10-01", 500, 0),
      drink("milk_tea", "2026-10-01", 300, 90),
      drink("coca_cola", "2026-10-01", 330, 140, { unit: "can", quantity: 1 }),
      entry("2026-10-02", 1900),
      drink("water", "2026-10-02", 750, 0),
      drink("beer_regular", "2026-10-02", 330, 140, { unit: "can", quantity: 2 }),
    ];
    const r = drinkSummary(e, insights(e).days, lookup);
    expect(r?.countedDays).toBe(2);
    expect(r?.waterGlasses).toBeCloseTo((500 + 750) / 250 / 2, 9);
    expect(r?.cups).toBeCloseTo(300 / 150 / 2, 9);
    expect(r?.sweetDrinks).toBe(1);
    expect(r?.alcoholDrinks).toBe(2);
    expect(drinkSummary([entry("2026-10-01", 1900)], insights([entry("2026-10-01", 1900)]).days, lookup)).toBeNull();
  });
});

describe("highlights", () => {
  it("finds the extremes, the favourite and what was new", () => {
    const e = [
      entry("2026-09-20", 1800, { foodId: "roti", name: "Roti" }),
      entry("2026-10-01", 2600, { foodId: "roti", name: "Roti", protein: 60 }),
      entry("2026-10-02", 1500, { foodId: "dal_tadka", name: "Dal Tadka", protein: 90 }),
      entry("2026-10-03", 2100, { foodId: "roti", name: "Roti", protein: 70 }),
      entry("2026-10-03", 100, { foodId: "paneer", name: "Paneer", protein: 5 }),
    ];
    const h = highlights(e, insights(e).days, "2026-10");
    expect(h.heaviest).toEqual({ date: "2026-10-01", calories: 2600 });
    expect(h.lightest).toEqual({ date: "2026-10-02", calories: 1500 });
    expect(h.topProtein).toEqual({ date: "2026-10-02", protein: 90 });
    expect(h.mostLogged).toEqual({ name: "Roti", times: 2 });
    expect(h.foodsEaten).toBe(3);
    expect(h.newFoods).toBe(2);
  });

  it("has nothing to say about an empty month", () => {
    expect(highlights([], insights([]).days, "2026-10")).toMatchObject({ heaviest: null, lightest: null, mostLogged: null, foodsEaten: 0, newFoods: 0 });
  });
});
