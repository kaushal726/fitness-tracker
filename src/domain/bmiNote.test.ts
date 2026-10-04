import { describe, expect, it } from "vitest";
import { bmiNote, healthyRangeText } from "./bmiNote.ts";

describe("bmiNote", () => {
  it("names the healthy range for a height", () => {
    expect(healthyRangeText(170)).toBe("53.5\u201372 kg");
  });

  it("is good news inside the range and says how far outside it otherwise", () => {
    expect(bmiNote(65, 170)).toMatchObject({ tone: "good", headline: "In the healthy range" });
    const over = bmiNote(80, 170);
    expect(over).toMatchObject({ tone: "info", headline: "8 kg above the healthy range" });
    expect(over.detail).toContain("53.5\u201372 kg");
    expect(bmiNote(95, 170).tone).toBe("warn");
    expect(bmiNote(48, 170)).toMatchObject({ tone: "warn", headline: "5.5 kg below the healthy range" });
  });
});
