import { describe, expect, it } from "vitest";
import { searchFood } from "./search.ts";

describe("search puts what is eaten most first", () => {
  it("ranks a food the person eats a lot above other matches", () => {
    const plain = searchFood("dal", { limit: 40 }).map((f) => f.id);
    const eaten = plain[25];
    const boosted = searchFood("dal", { limit: 40, frequentIds: [eaten] }).map((f) => f.id);
    expect(boosted.indexOf(eaten)).toBeLessThan(plain.indexOf(eaten));
    expect(boosted.indexOf(eaten)).toBeLessThan(5);
  });

  it("does not bring back a food that does not match", () => {
    const ids = searchFood("dal", { limit: 40, frequentIds: ["banana"] }).map((f) => f.id);
    expect(ids).not.toContain("banana");
  });
});
