import { describe, expect, it } from "vitest";
import { cmFromFeetInches, feetInchesFromCm, formatHeight } from "./height.ts";
import { fromWeeks, formatTimeline, isValidWeeks, MAX_WEEKS, MIN_WEEKS, toWeeks, weeksToUnit } from "./timeline.ts";

describe("timeline", () => {
  it("turns days, weeks and months into weeks", () => {
    expect(toWeeks(14, "days")).toBe(2);
    expect(toWeeks(12, "weeks")).toBe(12);
    expect(toWeeks(6, "months")).toBe(26);
    expect(toWeeks(45, "days")).toBeCloseTo(6.43, 2);
  });

  it("reads whole weeks as weeks and anything else as days", () => {
    expect(fromWeeks(12)).toEqual({ value: 12, unit: "weeks" });
    expect(fromWeeks(toWeeks(45, "days"))).toEqual({ value: 45, unit: "days" });
    expect(formatTimeline(1)).toBe("1 week");
    expect(formatTimeline(26)).toBe("26 weeks");
    expect(formatTimeline(toWeeks(1, "days") + 0)).toBe("1 day");
  });

  it("keeps the same time when the unit changes", () => {
    expect(weeksToUnit(12, "months")).toBe(3);
    expect(weeksToUnit(12, "days")).toBe(84);
    expect(weeksToUnit(0.5, "weeks")).toBe(1);
  });

  it("accepts a week up to five years, and nothing outside", () => {
    expect(isValidWeeks(MIN_WEEKS)).toBe(true);
    expect(isValidWeeks(MAX_WEEKS)).toBe(true);
    expect(isValidWeeks(0.5)).toBe(false);
    expect(isValidWeeks(MAX_WEEKS + 1)).toBe(false);
    expect(isValidWeeks(Number.NaN)).toBe(false);
  });
});

describe("height", () => {
  it("converts between centimetres and feet and inches", () => {
    expect(cmFromFeetInches(5, 9)).toBeCloseTo(175.26, 2);
    expect(feetInchesFromCm(175)).toEqual({ feet: 5, inches: 9 });
    expect(feetInchesFromCm(182.9)).toEqual({ feet: 6, inches: 0 });
    expect(formatHeight(175, "cm")).toBe("175 cm");
    expect(formatHeight(175, "ft")).toBe("5 ft 9 in");
  });
});
