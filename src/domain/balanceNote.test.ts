import { describe, expect, it } from "vitest";
import { entry } from "../test/entries.ts";
import { balanceNote } from "./balanceNote.ts";
import { monthInsights } from "./monthInsights.ts";

const month = (entries: ReturnType<typeof entry>[], today: string, m = "2026-10") => monthInsights({ entries, goal: 2000, floor: 1500, month: m, today });

describe("balance note", () => {
  it("says a month has not started, or has nothing to compare", () => {
    expect(balanceNote(month([], "2026-10-06", "2026-11"), -1).headline).toBe("This month has not started");
    expect(balanceNote(month([], "2026-10-06"), -1).headline).toBe("Your balance starts here");
    expect(balanceNote(month([], "2026-11-06", "2026-10"), -1).headline).toBe("Nothing to compare");
  });

  it("calls a month within a few calories of the goal right on it", () => {
    const note = balanceNote(month([entry("2026-10-01", 2010)], "2026-10-02"), -1);
    expect(note).toMatchObject({ tone: "good", headline: "Right on your goal" });
  });

  it("is good news to be under the goal when the aim is to eat less, and says what today can be", () => {
    const note = balanceNote(month([entry("2026-10-01", 1500), entry("2026-10-02", 1500)], "2026-10-03"), -1);
    expect(note.tone).toBe("good");
    expect(note.headline).toBe("1,000 kcal under your goal so far");
    expect(note.detail).toContain("Today you could have up to");
  });

  it("asks for less on the days left when over", () => {
    const note = balanceNote(month([entry("2026-10-01", 2900), entry("2026-10-02", 2900)], "2026-10-03"), -1);
    expect(note.tone).toBe("warn");
    expect(note.headline).toBe("1,800 kcal over your goal so far");
    expect(note.detail).toBe("About 62 kcal less a day brings you back by the end of the month.");
  });

  it("flags that the ask is capped when too few days are left to make it up", () => {
    const note = balanceNote(month([entry("2026-10-01", 2900), entry("2026-10-02", 2900)], "2026-10-29"), -1);
    expect(note.detail).toContain("less a day");
    expect(note.detail).toContain("the most to ask of one day");
  });

  it("turns the same numbers round for a goal of eating more", () => {
    const under = balanceNote(month([entry("2026-10-01", 1500), entry("2026-10-02", 1500)], "2026-10-03"), 1);
    expect(under.tone).toBe("warn");
    expect(under.headline).toBe("1,000 kcal behind your goal so far");
    expect(under.detail).toContain("more a day gets you back on plan");
    const over = balanceNote(month([entry("2026-10-01", 2500), entry("2026-10-02", 2500)], "2026-10-03"), 1);
    expect(over.tone).toBe("good");
    expect(over.headline).toBe("1,000 kcal ahead of your goal");
  });

  it("sums up a finished month", () => {
    const note = balanceNote(month([entry("2026-10-01", 2500), entry("2026-10-02", 2500)], "2026-11-05"), -1);
    expect(note.headline).toBe("1,000 kcal over your goal");
    expect(note.detail).toBe("That is about 500 kcal a day over across the logged days.");
  });
});
