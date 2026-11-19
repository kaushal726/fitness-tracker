import { describe, expect, it } from "vitest";
import { searchFood } from "./search.ts";

const names = (query: string, limit = 6) => searchFood(query, { limit }).map((f) => f.name);

describe("search puts the plain food before a brand's product", () => {
  it("shows a banana before a nutrition drink that happens to be banana flavoured", () => {
    const top = names("banana");
    expect(top[0]).toBe("Banana");
    expect(top.indexOf("Robusta Banana")).toBeGreaterThanOrEqual(0);
    expect(top.indexOf("Robusta Banana")).toBeLessThan(top.indexOf("Complan Banana") === -1 ? Infinity : top.indexOf("Complan Banana"));
  });

  it("does not let a nutrition drink claim 'chocolate' as its own nickname", () => {
    expect(names("chocolate", 5)).not.toContain("PediaSure Chocolate");
  });

  it("leaves a brand's products first when the brand is typed", () => {
    expect(names("complan banana", 1)[0]).toBe("Complan Banana");
    expect(names("pediasure", 1)[0]).toMatch(/^PediaSure/);
    expect(names("amul", 3).every((n) => n.startsWith("Amul"))).toBe(true);
  });

  it("shows the plain dish before a shop's version of it", () => {
    expect(names("samosa", 4).every((n) => !n.includes("Haldiram"))).toBe(true);
  });
});

describe("search prefers the words typed together, in order", () => {
  it("finds Cadbury Dairy Milk for 'dairy milk' ahead of any milk from a dairy", () => {
    const top = names("dairy milk", 4);
    expect(top).toContain("Cadbury Dairy Milk");
    expect(top.some((n) => n.startsWith("Mother Dairy"))).toBe(false);
  });

  it("does not drop a food whose nickname starts with the query below one whose name merely has the words", () => {
    expect(names("dairy milk", 20)).toContain("Cadbury Dairy Milk");
  });
});
