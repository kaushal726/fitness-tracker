import { describe, expect, it } from "vitest";
import type { Profile } from "../data/types.ts";
import { stampWeight } from "./profileWeight.ts";

const profile: Profile = { name: "A", age: 30, gender: "male", heightCm: 175, weightKg: 85, goal: "lose_fat", targetWeightKg: 75, weeks: 20, activity: "light" };

describe("stampWeight", () => {
  it("dates a new profile today and remembers its weight as the start", () => {
    expect(stampWeight(profile, null, "2026-10-01")).toMatchObject({ weightDate: "2026-10-01", startWeightKg: 85 });
  });

  it("keeps the date and the start while the weight is unchanged", () => {
    const saved = stampWeight(profile, null, "2026-10-01");
    expect(stampWeight({ ...profile, goal: "lose_weight" }, saved, "2026-10-20")).toMatchObject({ goal: "lose_weight", weightDate: "2026-10-01", startWeightKg: 85 });
  });

  it("re-dates a changed weight but keeps the first weight as the start", () => {
    const saved = stampWeight(profile, null, "2026-10-01");
    const weighed = stampWeight({ ...profile, weightKg: 83.4 }, saved, "2026-10-20");
    expect(weighed).toMatchObject({ weightKg: 83.4, weightDate: "2026-10-20", startWeightKg: 85 });
    expect(stampWeight({ ...profile, weightKg: 82 }, weighed, "2026-11-02")).toMatchObject({ weightDate: "2026-11-02", startWeightKg: 85 });
  });

  it("leaves an older profile without the fields alone until its weight changes", () => {
    expect(stampWeight(profile, profile, "2026-10-20")).toEqual(profile);
    expect(stampWeight({ ...profile, weightKg: 84 }, profile, "2026-10-20")).toMatchObject({ weightDate: "2026-10-20", startWeightKg: 85 });
  });
});
