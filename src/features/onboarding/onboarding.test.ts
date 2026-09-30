import { describe, expect, it } from "vitest";
import { computePlan } from "../../domain/goals.ts";
import type { Profile } from "../../data/types.ts";
import { nextStep, previousStep, progressOf, stepOrder } from "./flow.ts";
import { paceSentence } from "./pace.ts";
import { activeSteps } from "./steps/registry.tsx";
import { parseAnswers, type FormState } from "./useProfileForm.ts";

const form = (patch: Partial<FormState> = {}): FormState => ({
  name: "", gender: "male", age: "30", heightUnit: "cm", heightCm: "175", heightFt: "", heightIn: "", weightKg: "75",
  goal: "maintain", targetWeightKg: "", timelineUnit: "weeks", timelineValue: "12", activity: "light", ...patch,
});

describe("setup flow", () => {
  it("asks fewer questions when the goal does not move the scale", () => {
    expect(stepOrder(form({ goal: "maintain" }))).toEqual(["name", "gender", "age", "height", "weight", "goal", "activity", "plan"]);
    expect(stepOrder(form({ goal: "lose_fat" }))).toEqual(["name", "gender", "age", "height", "weight", "goal", "target", "timeline", "activity", "plan"]);
    expect(activeSteps(form({ goal: null })).some((s) => s.id === "target")).toBe(false);
  });

  it("moves forward and back through the questions and ends on the plan", () => {
    const f = form({ goal: "gain_muscle" });
    expect(nextStep(f, "goal")).toBe("target");
    expect(nextStep(f, "timeline")).toBe("activity");
    expect(nextStep(f, "activity")).toBe("plan");
    expect(nextStep(f, "plan")).toBeNull();
    expect(previousStep(f, "target")).toBe("goal");
    expect(previousStep(f, "name")).toBeNull();
  });

  it("reports progress from the first question to the finished plan", () => {
    const f = form({ goal: "maintain" });
    expect(progressOf(f, "name")).toBeCloseTo(1 / 8, 5);
    expect(progressOf(f, "plan")).toBe(1);
  });
});

describe("reading the answers", () => {
  it("accepts height in feet and inches, and any timeline unit", () => {
    const a = parseAnswers(form({ heightUnit: "ft", heightFt: "5", heightIn: "9", goal: "lose_fat", targetWeightKg: "68", timelineUnit: "months", timelineValue: "6" }));
    expect(a.heightCm).toBeCloseTo(175.26, 2);
    expect(a.weeks).toBe(26);
    expect(a.targetWeightKg).toBe(68);
    expect(parseAnswers(form({ heightUnit: "ft", heightFt: "5", heightIn: "" })).heightCm).toBeCloseTo(152.4, 1);
    expect(parseAnswers(form({ goal: "lose_fat", timelineUnit: "days", timelineValue: "45" })).weeks).toBeCloseTo(6.43, 2);
  });

  it("ignores the target and timeline for a goal that does not move the scale", () => {
    const a = parseAnswers(form({ goal: "maintain", targetWeightKg: "60" }));
    expect(a.targetWeightKg).toBeNull();
    expect(a.weeks).toBeNull();
  });
});

describe("pace sentence", () => {
  const profile: Profile = { name: "", age: 30, gender: "male", heightCm: 175, weightKg: 75, goal: "lose_fat", targetWeightKg: 68, weeks: 13, activity: "moderate" };

  it("stays quiet when holding steady", () => {
    expect(paceSentence(computePlan({ ...profile, goal: "maintain", targetWeightKg: null, weeks: null }))).toBeNull();
  });

  it("describes a normal pace plainly", () => {
    const plan = computePlan({ ...profile, weeks: 30 });
    expect(paceSentence(plan, 30)).toMatchObject({ warn: false, text: expect.stringContaining("You would lose about") });
  });

  it("only warns when the safe pace is clearly longer than asked for", () => {
    const fast = computePlan({ ...profile, weightKg: 75, targetWeightKg: 55, weeks: 4 });
    expect(fast.adjusted).toBe(true);
    expect(paceSentence(fast, 4)?.warn).toBe(true);
    // A little over the safe limit: the plan differs from the ask by about a week, which is not worth a warning.
    const nearly = computePlan({ ...profile, activity: "light", weeks: 12 });
    expect(nearly.adjusted).toBe(true);
    expect(paceSentence(nearly, 12)).toMatchObject({ warn: false, text: expect.stringContaining("A safe pace for you") });
  });
});
