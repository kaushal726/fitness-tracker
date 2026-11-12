import { describe, expect, it } from "vitest";
import { clampKg, signedKg, weighInDayFor, weighInDue, weighInSummary, weightPoints, withWeighIn } from "./weighIns.ts";

describe("the weight log", () => {
  it("keeps one weight a day, to one decimal, inside the limits", () => {
    const log = withWeighIn(withWeighIn({}, "2026-11-07", 78.04), "2026-11-07", 77.86);
    expect(log).toEqual({ "2026-11-07": 77.9 });
    expect(clampKg(5)).toBe(25);
    expect(clampKg(999)).toBe(300);
  });

  it("adds the profile's weight on its day when the log does not have it, and sorts oldest first", () => {
    const points = weightPoints({ "2026-11-07": 77.5, "2026-10-31": 78.2 }, { weightKg: 79, weightDate: "2026-10-20" });
    expect(points.map((p) => p.date)).toEqual(["2026-10-20", "2026-10-31", "2026-11-07"]);
    expect(weightPoints({ "2026-11-07": 77.5 }, { weightKg: 77.5, weightDate: "2026-11-07" })).toHaveLength(1);
  });
});

describe("weigh-in day", () => {
  it("is the latest Saturday", () => {
    expect(weighInDayFor("2026-11-14")).toBe("2026-11-14"); // Saturday
    expect(weighInDayFor("2026-11-15")).toBe("2026-11-14"); // Sunday
    expect(weighInDayFor("2026-11-12")).toBe("2026-11-07"); // Thursday
  });

  it("asks on Saturday and Sunday until the scale is stepped on", () => {
    const old = [{ date: "2026-11-07", kg: 78 }];
    expect(weighInDue(old, "2026-11-14")).toBe(true);
    expect(weighInDue(old, "2026-11-15")).toBe(true);
    expect(weighInDue(old, "2026-11-16")).toBe(false);
    expect(weighInDue(old, "2026-11-12")).toBe(false);
    expect(weighInDue([...old, { date: "2026-11-14", kg: 77.6 }], "2026-11-15")).toBe(false);
  });
});

describe("how the weigh-ins are going", () => {
  const points = [
    { date: "2026-10-24", kg: 80 },
    { date: "2026-10-31", kg: 79.2 },
    { date: "2026-11-07", kg: 78.6 },
  ];

  it("says how far it moved, and that it moved toward a lower target", () => {
    expect(weighInSummary(points, -1, 72)).toMatchObject({ changeKg: -0.6, totalKg: -1.4, trend: "toward", toGoKg: 6.6, reached: false });
  });

  it("calls the same move away from a higher target", () => {
    expect(weighInSummary(points, 1, 85)?.trend).toBe("away");
  });

  it("calls a small wobble steady, and says when the target is passed", () => {
    expect(weighInSummary([{ date: "a", kg: 70 }, { date: "b", kg: 70.1 }], -1, 72)).toMatchObject({ trend: "steady", reached: true, toGoKg: null });
  });

  it("has no change with one weigh-in, and nothing with none", () => {
    expect(weighInSummary(points.slice(0, 1), -1, 72)).toMatchObject({ changeKg: null, trend: null, totalKg: 0 });
    expect(weighInSummary([], -1, 72)).toBeNull();
  });

  it("writes a change with its sign", () => {
    expect(signedKg(0.44)).toBe("+0.4");
    expect(signedKg(-1.26)).toBe("−1.3");
    expect(signedKg(0.01)).toBe("0");
  });
});
