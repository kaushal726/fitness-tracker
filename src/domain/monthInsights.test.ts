import { describe, expect, it } from "vitest";
import { entry } from "../test/entries.ts";
import { random } from "../test/random.ts";
import { daysInMonth, monthDates, monthLabel, shiftMonth, weekdayIndex } from "./month.ts";
import { isCounted, monthInsights, PARTIAL_DAY_SHARE } from "./monthInsights.ts";

const MONTH = "2026-10";
const GOAL = 2000;
const FLOOR = 1500;

describe("months", () => {
  it("knows its days, its neighbours and its label", () => {
    expect(daysInMonth("2026-10")).toBe(31);
    expect(daysInMonth("2026-02")).toBe(28);
    expect(daysInMonth("2028-02")).toBe(29);
    expect(monthDates("2026-02")).toHaveLength(28);
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(monthLabel("2026-10")).toBe("October 2026");
    expect(weekdayIndex("2026-10-05")).toBe(0); // a Monday
    expect(weekdayIndex("2026-10-11")).toBe(6); // a Sunday
  });
});

describe("month balance", () => {
  const entries = [
    entry("2026-10-01", 2500),
    entry("2026-10-02", 1500),
    entry("2026-10-03", 2400),
    entry("2026-10-04", GOAL * PARTIAL_DAY_SHARE - 1), // half-logged: left out
    // the 5th was not logged at all: left out
    entry("2026-10-06", 2600), // today
  ];
  const m = monthInsights({ entries, goal: GOAL, floor: FLOOR, month: MONTH, today: "2026-10-06" });

  it("compares finished, fully logged days with the goal and leaves the rest out", () => {
    expect(m.phase).toBe("current");
    expect(m.monthGoal).toBe(GOAL * 31);
    expect(m.countedDays).toBe(3);
    expect(m.balance).toBe(GOAL - 2500 + (GOAL - 1500) + (GOAL - 2400));
    expect(m.overDays).toBe(2);
    expect(m.loggedDays).toBe(5);
    expect(m.days.find((d) => d.day === 4)?.partial).toBe(true);
    expect(m.days.find((d) => d.day === 5)?.logged).toBe(false);
    expect(m.average?.calories).toBeCloseTo((2500 + 1500 + 2400) / 3, 6);
  });

  it("reports the balance after every finished day, from the first", () => {
    expect(m.series.map((p) => p.day)).toEqual([1, 2, 3, 4, 5]);
    expect(m.series.map((p) => p.balance)).toEqual([-500, 0, -400, -400, -400]);
  });

  it("spreads what is owed over the days that are left, today included", () => {
    const r = m.rebalance;
    expect(r?.remainingDays).toBe(26);
    expect(r?.capped).toBe(false);
    expect(r?.allowance).toBeCloseTo(GOAL + -400 / 26, 6);
    expect(r?.projection.at(-1)?.balance).toBeCloseTo(0, 6);
    expect(r?.projection[0]).toEqual({ day: 5, balance: -400 });
  });
});

describe("limits on the rebalance", () => {
  it("never asks a day to swing further than 15% down or 10% up", () => {
    const owed = monthInsights({ entries: [entry("2026-10-01", 9000)], goal: GOAL, floor: FLOOR, month: MONTH, today: "2026-10-29" });
    expect(owed.rebalance?.allowance).toBe(GOAL * 0.85 > FLOOR ? GOAL * 0.85 : FLOOR);
    expect(owed.rebalance?.capped).toBe(true);
    const banked = monthInsights({ entries: [entry("2026-10-01", 1000)], goal: GOAL, floor: FLOOR, month: MONTH, today: "2026-10-29" });
    expect(banked.rebalance?.allowance).toBe(GOAL * 1.1);
    expect(banked.rebalance?.capped).toBe(true);
  });

  it("never goes below the floor", () => {
    const m = monthInsights({ entries: [entry("2026-10-01", 6000)], goal: 1600, floor: 1500, month: MONTH, today: "2026-10-30" });
    expect(m.rebalance?.allowance).toBe(1500);
  });

  it("has nothing to rebalance outside the month that is under way", () => {
    expect(monthInsights({ entries: [], goal: GOAL, floor: FLOOR, month: "2026-09", today: "2026-10-06" }).rebalance).toBeNull();
    expect(monthInsights({ entries: [], goal: GOAL, floor: FLOOR, month: "2026-11", today: "2026-10-06" }).rebalance).toBeNull();
  });

  it("starts a month with no balance and the plain goal", () => {
    const m = monthInsights({ entries: [], goal: GOAL, floor: FLOOR, month: MONTH, today: "2026-10-01" });
    expect(m.balance).toBe(0);
    expect(m.series).toEqual([]);
    expect(m.average).toBeNull();
    expect(m.rebalance?.allowance).toBe(GOAL);
    expect(m.rebalance?.remainingDays).toBe(31);
  });
});

describe("generated months", () => {
  it("keeps its books straight for any pattern of logged days", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const rand = random(seed);
      const goal = 1400 + Math.round(rand() * 1800);
      const today = `2026-10-${String(1 + Math.floor(rand() * 31)).padStart(2, "0")}`;
      const entries = monthDates(MONTH).flatMap((date) => {
        if (rand() < 0.3) return []; // an unlogged day
        const kcal = Math.round(goal * (0.2 + rand() * 1.6));
        return rand() < 0.5 ? [entry(date, kcal)] : [entry(date, kcal * 0.6), entry(date, kcal * 0.4, { meal: "dinner" })];
      });
      const m = monthInsights({ entries, goal, floor: 1200, month: MONTH, today });

      // The balance is what an independent walk through the finished, whole days gives.
      const expected = monthDates(MONTH)
        .filter((d) => d < today)
        .reduce((sum, d) => {
          const kcal = entries.filter((e) => e.date === d).reduce((s, e) => s + e.nutrition.calories, 0);
          return kcal >= goal * PARTIAL_DAY_SHARE ? sum + goal - kcal : sum;
        }, 0);
      expect(m.balance).toBeCloseTo(expected, 6);
      expect(m.series.at(-1)?.balance ?? 0).toBeCloseTo(m.balance, 6);
      expect(m.series).toHaveLength(monthDates(MONTH).filter((d) => d < today).length);
      expect(m.eaten).toBeCloseTo(entries.reduce((s, e) => s + e.nutrition.calories, 0), 6);
      expect(m.countedDays).toBe(m.days.filter(isCounted).length);

      const r = m.rebalance;
      expect(r).not.toBeNull();
      if (!r) continue;
      expect(r.remainingDays).toBe(31 - (Number(today.slice(8)) - 1));
      expect(r.allowance).toBeGreaterThanOrEqual(Math.min(1200, goal) - 1e-9);
      expect(r.allowance).toBeGreaterThanOrEqual(goal * 0.85 - 1e-9);
      expect(r.allowance).toBeLessThanOrEqual(goal * 1.1 + 1e-9);
      expect(r.projection.at(-1)?.balance).toBeCloseTo(m.balance - r.remainingDays * r.adjustment, 6);
      if (!r.capped) expect(r.projection.at(-1)?.balance).toBeCloseTo(0, 6);
    }
  });
});
