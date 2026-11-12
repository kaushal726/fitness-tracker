import { describe, expect, it } from "vitest";
import type { Entry } from "../data/types.ts";
import { ZERO_TOTALS } from "../nutrition/constants.ts";
import { clampGlassMl, clampWaterGoal,foodWaterByDate, formatVolume, glassesOf, trackedWater, waterByDate, waterShare, waterSummary, withWater } from "./water.ts";

const entry = (foodId: string, date: string, grams: number): Entry => ({
  id: `${foodId}-${date}-${grams}`,
  date,
  at: 0,
  meal: "snack",
  foodId,
  name: foodId,
  quantity: 1,
  unit: "glass",
  portionText: "1 glass",
  grams,
  nutrition: ZERO_TOTALS,
});

describe("water log", () => {
  it("adds and takes away on one day without touching the others", () => {
    const log = withWater(withWater({ "2026-11-01": 500 }, "2026-11-02", 250), "2026-11-02", 250);
    expect(log).toEqual({ "2026-11-01": 500, "2026-11-02": 500 });
    expect(trackedWater(log, "2026-11-02")).toBe(500);
    expect(trackedWater(log, "2026-11-03")).toBe(0);
    expect(withWater(log, "2026-11-02", -250)).toEqual({ "2026-11-01": 500, "2026-11-02": 250 });
  });

  it("never goes below zero, and forgets a day that is back to nothing", () => {
    expect(withWater({ "2026-11-01": 250 }, "2026-11-01", -900)).toEqual({});
    expect(withWater({}, "2026-11-01", -250)).toEqual({});
  });

  it("does not change the log it was given", () => {
    const log = { "2026-11-01": 250 };
    withWater(log, "2026-11-01", 250);
    expect(log).toEqual({ "2026-11-01": 250 });
  });

  it("stops a day at an amount nobody drinks", () => {
    expect(trackedWater(withWater({}, "2026-11-01", 999_999), "2026-11-01")).toBe(12_000);
  });
});

describe("a day's water", () => {
  const entries = [entry("water", "2026-11-01", 500), entry("mineral_water", "2026-11-01", 250), entry("coconut_water", "2026-11-01", 255), entry("masala_chai", "2026-11-02", 150)];

  it("counts plain water logged as food, and nothing else", () => {
    expect([...foodWaterByDate(entries)]).toEqual([["2026-11-01", 750]]);
  });

  it("adds what was tapped in to the water logged as food", () => {
    const byDate = waterByDate({ "2026-11-01": 250, "2026-11-03": 1000 }, entries);
    expect(byDate.get("2026-11-01")).toBe(1000);
    expect(byDate.get("2026-11-03")).toBe(1000);
    expect(byDate.has("2026-11-02")).toBe(false);
  });

  it("sums up the days that have water against the goal", () => {
    const byDate = new Map([["2026-11-01", 2000], ["2026-11-02", 1000], ["2026-11-04", 2500]]);
    const s = waterSummary(["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04"], byDate, 2000);
    expect(s).toEqual({ days: 3, averageMl: 5500 / 3, daysReached: 2 });
    expect(waterSummary(["2026-11-03"], byDate, 2000)).toEqual({ days: 0, averageMl: 0, daysReached: 0 });
  });
});

describe("water in words and numbers", () => {
  it("turns millilitres into glasses to one decimal", () => {
    expect(glassesOf(625, 250)).toBe(2.5);
    expect(glassesOf(2000, 250)).toBe(8);
    expect(glassesOf(500, 300)).toBe(1.7);
    expect(glassesOf(500, 0)).toBe(0);
  });

  it("keeps the share between nothing and all of it", () => {
    expect(waterShare(500, 2000)).toBe(0.25);
    expect(waterShare(5000, 2000)).toBe(1);
    expect(waterShare(500, 0)).toBe(0);
  });

  it("writes small amounts in ml and the rest in litres", () => {
    expect(formatVolume(750)).toBe("750 ml");
    expect(formatVolume(1000)).toBe("1 L");
    expect(formatVolume(1250)).toBe("1.25 L");
    expect(formatVolume(2500)).toBe("2.5 L");
  });

  it("keeps a goal on a step and inside the limits", () => {
    expect(clampWaterGoal(2100)).toBe(2000);
    expect(clampWaterGoal(2130)).toBe(2250);
    expect(clampWaterGoal(100)).toBe(1000);
    expect(clampWaterGoal(99_999)).toBe(6000);
  });

  it("keeps a glass on a step and inside the limits", () => {
    expect(clampGlassMl(260)).toBe(250);
    expect(clampGlassMl(340)).toBe(350);
    expect(clampGlassMl(10)).toBe(50);
    expect(clampGlassMl(5000)).toBe(1000);
  });
});
