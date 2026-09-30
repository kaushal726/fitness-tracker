import { describe, expect, it } from "vitest";
import { formatPortionText, formatQuantity, parseNumber, sentenceCase } from "./format.ts";

describe("text for people", () => {
  it("capitalises only the first letter", () => {
    expect(sentenceCase("medium banana")).toBe("Medium banana");
    expect(sentenceCase("plate (2 dosa)")).toBe("Plate (2 dosa)");
    expect(sentenceCase("")).toBe("");
  });

  it("words a stored portion with proper casing", () => {
    expect(formatPortionText("1 medium banana")).toBe("1 × Medium banana");
    expect(formatPortionText("2 dosa")).toBe("2 × Dosa");
    expect(formatPortionText("1.5 katori")).toBe("1.5 × Katori");
    expect(formatPortionText("200 g")).toBe("200 g");
    expect(formatPortionText("250 ml")).toBe("250 ml");
    expect(formatPortionText("plain")).toBe("Plain");
  });

  it("drops trailing zeros from quantities and reads typed numbers", () => {
    expect(formatQuantity(1.5)).toBe("1.5");
    expect(formatQuantity(2)).toBe("2");
    expect(formatQuantity(0.333)).toBe("0.33");
    expect(parseNumber("1,250")).toBe(1250);
    expect(parseNumber("  ")).toBeNaN();
    expect(parseNumber("abc")).toBeNaN();
  });
});
