import { describe, expect, it } from "vitest";
import { daysBetween } from "./dates.ts";

describe("daysBetween", () => {
  it("counts calendar days, across months and clock changes", () => {
    expect(daysBetween("2026-10-01", "2026-10-20")).toBe(19);
    expect(daysBetween("2026-10-20", "2026-10-20")).toBe(0);
    expect(daysBetween("2026-10-20", "2026-10-01")).toBe(-19);
    expect(daysBetween("2026-02-27", "2026-03-02")).toBe(3);
    expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2);
    expect(daysBetween("2026-10-24", "2026-10-26")).toBe(2);
  });
});
