import { describe, expect, it } from "vitest";
import { formatSpan, spanParts } from "./duration.ts";

describe("formatSpan", () => {
  it("picks the unit that reads best", () => {
    expect(formatSpan(1)).toBe("1 day");
    expect(formatSpan(9)).toBe("9 days");
    expect(formatSpan(14)).toBe("2 weeks");
    expect(formatSpan(45)).toBe("6 weeks");
    expect(formatSpan(120)).toBe("4 months");
    expect(formatSpan(700)).toBe("23 months");
    expect(formatSpan(800)).toBe("over 2 years");
    expect(formatSpan(0.2)).toBe("1 day");
  });

  it("gives the number and the unit apart", () => {
    expect(spanParts(150)).toEqual({ prefix: "", value: 5, unit: "months" });
    expect(spanParts(1)).toEqual({ prefix: "", value: 1, unit: "day" });
    expect(spanParts(1200)).toEqual({ prefix: "over ", value: 3, unit: "years" });
  });
});
