import { describe, expect, it } from "vitest";
import { dayVerdict, groupByWeek, weekStartOf } from "./dayVerdict.ts";

describe("how a day went", () => {
  it("counts a little over as on track, and says how far over or under otherwise", () => {
    expect(dayVerdict(2050, 2000)).toEqual({ kind: "onTrack", amount: 0 });
    expect(dayVerdict(2300, 2000)).toEqual({ kind: "over", amount: 300 });
    expect(dayVerdict(1750, 2000)).toEqual({ kind: "onTrack", amount: 0 });
    expect(dayVerdict(1200, 2000)).toEqual({ kind: "under", amount: 800 });
  });

  it("does not judge a day without a goal", () => {
    expect(dayVerdict(900, 0).kind).toBe("onTrack");
  });
});

describe("weeks", () => {
  it("start on a Monday", () => {
    expect(weekStartOf("2026-11-12")).toBe("2026-11-09"); // Thursday
    expect(weekStartOf("2026-11-09")).toBe("2026-11-09"); // Monday
    expect(weekStartOf("2026-11-15")).toBe("2026-11-09"); // Sunday
  });

  it("gather the days of each week, newest first as given", () => {
    const days = ["2026-11-12", "2026-11-10", "2026-11-08", "2026-11-02", "2026-10-28"];
    expect(groupByWeek(days, (d) => d).map((g) => [g.start, g.items])).toEqual([
      ["2026-11-09", ["2026-11-12", "2026-11-10"]],
      ["2026-11-02", ["2026-11-08", "2026-11-02"]],
      ["2026-10-26", ["2026-10-28"]],
    ]);
  });
});
