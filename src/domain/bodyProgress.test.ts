import { describe, expect, it } from "vitest";
import type { Profile } from "../data/types.ts";
import { addDays } from "../lib/dates.ts";
import { entry } from "../test/entries.ts";
import { random } from "../test/random.ts";
import { bodyProgress, MIN_PACE_DAYS, PACE_WINDOW_DAYS, WEEKS_SHOWN } from "./bodyProgress.ts";
import { KCAL_PER_KG } from "./goals.ts";

const TDEE = 2500;
const GOAL = 2000;
const TODAY = "2026-10-20";
const profile: Profile = { name: "A", age: 30, gender: "male", heightCm: 175, weightKg: 85, goal: "lose_fat", targetWeightKg: 75, weeks: 20, activity: "light", weightDate: "2026-10-01", startWeightKg: 85 };
const day = (n: number) => `2026-10-${String(n).padStart(2, "0")}`;
const run = (entries: ReturnType<typeof entry>[], p: Profile = profile) => bodyProgress({ entries, profile: p, tdee: TDEE, goalCalories: GOAL, today: TODAY });
/** Every day from the 2nd to the 11th at the same intake. */
const steady = (kcal: number, days = 10) => Array.from({ length: days }, (_, i) => entry(day(i + 2), kcal));

describe("which days count", () => {
  it("leaves out today, half-logged days, empty days, and days up to the weigh-in", () => {
    const p = run([entry(day(1), 1500), entry(day(2), 1800), entry(day(3), GOAL * 0.4 - 1), entry(day(5), 2200), entry(TODAY, 900)]);
    expect(p.countedDays).toBe(2);
    expect(p.netKcal).toBe(1800 - TDEE + (2200 - TDEE));
  });

  it("counts from the first logged day when the profile has no weigh-in date", () => {
    const old: Profile = { ...profile, weightDate: undefined, startWeightKg: undefined };
    const p = run([entry(day(1), 1500), entry(day(2), 1700)], old);
    expect(p.countedDays).toBe(2);
    expect(p.since).toBe(day(1));
    expect(p.startKg).toBe(85);
  });

  it("counts the finished days since the weigh-in, logged or not", () => {
    expect(run([entry(day(5), 1800)]).elapsedDays).toBe(18); // 2nd to 19th
    expect(run([entry(day(5), 1800)], { ...profile, weightDate: undefined, startWeightKg: undefined }).elapsedDays).toBe(15); // 5th to 19th
    expect(run([]).elapsedDays).toBe(18);
  });

  it("adds up several entries of one day", () => {
    expect(run([entry(day(2), 700), entry(day(2), 900), entry(day(2), 400)]).netKcal).toBe(2000 - TDEE);
  });
});

describe("what the food says about the body", () => {
  it("turns the deficit into kilograms, 7700 kcal to the kilo", () => {
    const p = run(steady(2000));
    expect(p.netKcal).toBe(-500 * 10);
    expect(p.changeKg).toBeCloseTo(-5000 / KCAL_PER_KG, 9);
    expect(p.currentKg).toBeCloseTo(85 - 5000 / KCAL_PER_KG, 9);
    expect(p.kgPerWeek).toBeCloseTo((-500 * 7) / KCAL_PER_KG, 9);
    expect(p.avgEaten).toBe(2000);
  });

  it("gives no pace before a few counted days", () => {
    const p = run(steady(2000, MIN_PACE_DAYS - 1));
    expect(p.kgPerWeek).toBeNull();
    expect(p.target?.status).toBe("unknown");
    expect(run(steady(2000, MIN_PACE_DAYS)).kgPerWeek).not.toBeNull();
  });

  it("takes the pace from the latest days only", () => {
    const dates = (first: number, count: number) => Array.from({ length: count }, (_, i) => addDays("2026-09-01", first + i));
    const old = dates(0, 10).map((d) => entry(d, 3500));
    const lately = dates(10, PACE_WINDOW_DAYS).map((d) => entry(d, 2000));
    const p = run([...old, ...lately], { ...profile, weightDate: "2026-08-31" });
    expect(p.countedDays).toBe(10 + PACE_WINDOW_DAYS);
    expect(p.paceDays).toBe(PACE_WINDOW_DAYS);
    expect(p.avgNetKcal).toBe(2000 - TDEE);
    expect(p.netKcal).toBe(10 * (3500 - TDEE) + PACE_WINDOW_DAYS * (2000 - TDEE));
  });
});

describe("the way to the target", () => {
  it("says how long it takes at the current pace", () => {
    const p = run(steady(1950)); // 550 under every day: 0.5 kg a week
    expect(p.kgPerWeek).toBeCloseTo((-550 * 7) / KCAL_PER_KG, 9);
    expect(p.target?.status).toBe("heading");
    const toGo = 75 - p.currentKg;
    expect(p.target?.toGoKg).toBeCloseTo(toGo, 9);
    expect(p.target?.etaDays).toBe(Math.ceil(Math.abs(toGo) / (Math.abs(p.kgPerWeek ?? 0) / 7)));
    expect(p.target?.etaDate).not.toBeNull();
    expect(p.target?.fraction).toBeCloseTo((85 - p.currentKg) / 10, 9);
  });

  it("takes longer when the deficit is smaller", () => {
    const fast = run(steady(1800)).target?.etaDays ?? 0;
    const slow = run(steady(2200)).target?.etaDays ?? 0;
    expect(slow).toBeGreaterThan(fast);
  });

  it("says when the food is moving away from the target, or not moving", () => {
    expect(run(steady(2900)).target?.status).toBe("away");
    expect(run(steady(TDEE)).target?.status).toBe("steady");
  });

  it("says the target is reached once the estimate gets there, and when it was passed", () => {
    const p = run(steady(1000, 17), { ...profile, weightKg: 77 });
    expect(p.currentKg).toBeLessThan(75);
    expect(p.target).toMatchObject({ status: "reached", fraction: 1, etaDays: null });
  });

  it("has no target to measure against when the profile has none", () => {
    expect(run(steady(2000), { ...profile, goal: "maintain", targetWeightKg: null }).target).toBeNull();
  });

  it("works for a goal of gaining as well", () => {
    const gain: Profile = { ...profile, goal: "gain_weight", weightKg: 60, startWeightKg: 60, targetWeightKg: 66 };
    const p = run(steady(3000), gain);
    expect(p.changeKg).toBeGreaterThan(0);
    expect(p.target).toMatchObject({ status: "heading" });
    expect(p.target?.etaDays).toBeGreaterThan(0);
  });
});

describe("the path and the weeks", () => {
  it("starts at the weigh-in weight and ends at the estimate today", () => {
    const p = run(steady(2000));
    expect(p.path[0]).toEqual({ date: "2026-10-01", kg: 85 });
    expect(p.path.at(-1)?.date).toBe(TODAY);
    expect(p.path.at(-1)?.kg).toBeCloseTo(p.currentKg, 9);
    expect(p.path.length).toBe(p.countedDays + 2);
  });

  it("splits the change into Monday weeks that add back up to the whole", () => {
    const p = run(steady(2100, 16)); // 2nd to 17th, across three weeks
    expect(p.weeks.length).toBeLessThanOrEqual(WEEKS_SHOWN);
    expect(p.weeks.every((w) => new Date(`${w.start}T00:00:00`).getDay() === 1)).toBe(true);
    expect(p.weeks.reduce((s, w) => s + w.kg, 0)).toBeCloseTo(p.changeKg, 9);
    expect(p.weeks.reduce((s, w) => s + w.days, 0)).toBe(p.countedDays);
  });
});

describe("generated scenarios", () => {
  it("keeps the estimate, the path and the weeks consistent whatever was eaten", () => {
    const next = random(7);
    for (let round = 0; round < 60; round++) {
      const entries = [];
      for (let d = 2; d < 20; d++) if (next() > 0.25) for (let k = 0; k < 1 + Math.floor(next() * 4); k++) entries.push(entry(day(d), 200 + Math.floor(next() * 900)));
      const p = run(entries);
      expect(p.currentKg).toBeCloseTo(p.baseKg + p.netKcal / KCAL_PER_KG, 9);
      expect(p.path.at(-1)?.kg).toBeCloseTo(p.currentKg, 9);
      expect(p.weeks.reduce((s, w) => s + w.days, 0)).toBe(p.countedDays);
      if (p.kgPerWeek !== null && p.target?.status === "heading") expect(p.target.etaDays).toBeGreaterThan(0);
      if (p.kgPerWeek === null) expect(p.target?.status === "unknown" || p.target?.status === "reached").toBe(true);
    }
  });
});
