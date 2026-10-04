import { describe, expect, it } from "vitest";
import type { Profile } from "../data/types.ts";
import { addDays } from "../lib/dates.ts";
import { entry } from "../test/entries.ts";
import { bodyProgress } from "./bodyProgress.ts";
import { progressNote } from "./progressNote.ts";

const TDEE = 2500;
const GOAL = 2000;
const TODAY = "2026-10-20";
const profile: Profile = { name: "A", age: 30, gender: "male", heightCm: 175, weightKg: 85, goal: "lose_fat", targetWeightKg: 75, weeks: 20, activity: "light", weightDate: "2026-10-01", startWeightKg: 85 };
const progress = (kcal: number, days: number, p: Profile = profile) =>
  bodyProgress({ entries: Array.from({ length: days }, (_, i) => entry(addDays("2026-10-02", i), kcal)), profile: p, tdee: TDEE, goalCalories: GOAL, today: TODAY });
const say = (kcal: number, days: number, p: Profile = profile, direction: -1 | 0 | 1 = -1) => progressNote(progress(kcal, days, p), { direction, tdee: TDEE, planCalories: GOAL });

describe("progressNote", () => {
  it("waits for logged days, then for enough of them", () => {
    expect(say(2000, 0).headline).toBe("Your progress starts here");
    expect(say(2000, 2).headline).toBe("A few more days");
  });

  it("says how long it takes when the food leads to the target", () => {
    const n = say(1950, 10);
    expect(n.tone).toBe("good");
    expect(n.headline).toMatch(/^About \d+ (weeks|months) to 75 kg$/);
    expect(n.detail).toContain("0.5 kg a week");
  });

  it("warns when the pace is quick, steady, or the wrong way", () => {
    expect(say(1000, 10)).toMatchObject({ tone: "warn" });
    expect(say(1000, 10).headline).toMatch(/^Quick/);
    expect(say(TDEE, 10)).toMatchObject({ tone: "warn", headline: "Not moving yet" });
    const away = say(2900, 10);
    expect(away).toMatchObject({ tone: "warn", headline: "Moving away from 75 kg" });
    expect(away.detail).toContain("up 0.4 kg a week");
  });

  it("congratulates a reached target and describes a goal with no target", () => {
    expect(say(1000, 17, { ...profile, weightKg: 77 }).headline).toBe("You are at your goal weight");
    const maintain: Profile = { ...profile, goal: "maintain", targetWeightKg: null };
    expect(say(TDEE, 10, maintain, 0).headline).toBe("Holding steady");
    expect(say(2900, 10, maintain, 0)).toMatchObject({ tone: "warn" });
  });
});
