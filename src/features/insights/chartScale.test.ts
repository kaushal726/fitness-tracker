import { describe, expect, it } from "vitest";
import { niceCeil, niceTicks } from "./chartScale.ts";

describe("chart scales", () => {
  it("rounds up to a round number", () => {
    expect(niceCeil(0)).toBe(1);
    expect(niceCeil(1.2)).toBe(1.5);
    expect(niceCeil(740)).toBe(800);
    expect(niceCeil(2100)).toBe(2500);
  });

  it("picks round ticks that stay inside the range", () => {
    expect(niceTicks(72.3, 85.8, 4)).toEqual([75, 80, 85]);
    expect(niceTicks(82.1, 83.4, 4)).toEqual([82.5, 83]);
    for (const [lo, hi] of [[60, 61], [0, 1], [-3, 4], [100, 400]] as const) {
      const ticks = niceTicks(lo, hi, 4);
      expect(ticks.length).toBeGreaterThan(0);
      expect(ticks.every((t) => t >= lo - 1e-9 && t <= hi + 1e-9)).toBe(true);
    }
  });
});
