import { describe, expect, it } from "vitest";
import { ZERO_TOTALS } from "../nutrition/constants.ts";
import { caloriesByDate } from "./selectors.ts";
import type { Entry } from "./types.ts";

const entry = (id: string, date: string, calories: number): Entry => ({ id, date, at: 0, meal: "lunch", foodId: "roti", name: "Roti", quantity: 1, unit: "piece", portionText: "1 roti", grams: 40, nutrition: { ...ZERO_TOTALS, calories } });

describe("caloriesByDate", () => {
  it("adds up what was eaten on each day", () => {
    const byDate = caloriesByDate([entry("a", "2026-10-28", 300), entry("b", "2026-10-28", 120), entry("c", "2026-10-29", 90)]);
    expect(byDate.get("2026-10-28")).toBe(420);
    expect(byDate.get("2026-10-29")).toBe(90);
  });

  it("has no day that has nothing logged", () => {
    expect(caloriesByDate([entry("a", "2026-10-28", 300)]).has("2026-10-27")).toBe(false);
    expect(caloriesByDate([]).size).toBe(0);
  });
});
