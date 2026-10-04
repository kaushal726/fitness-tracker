import { describe, expect, it } from "vitest";
import { makeFoodLookup } from "../data/selectors.ts";
import { entry } from "../test/entries.ts";
import { cuisineLabel, isTreat, mixByCategory, mixByCuisine, mixByDiet, OTHER_KEY, treatShare } from "./foodMix.ts";

const lookup = makeFoodLookup([]);
const day = "2026-10-02";
const of = (foodId: string, calories: number) => entry(day, calories, { foodId });

describe("calorie mixes", () => {
  const entries = [of("roti", 300), of("dal_tadka", 200), of("gulab_jamun", 150), of("chicken_curry", 350), of("not_a_food", 100)];

  it("adds the calories of each kind and keeps unknown foods under Other, last", () => {
    const rows = mixByCategory(entries, lookup);
    expect(rows.reduce((s, r) => s + r.calories, 0)).toBe(1100);
    expect(rows.reduce((s, r) => s + r.share, 0)).toBeCloseTo(1, 9);
    expect(rows.at(-1)).toMatchObject({ key: OTHER_KEY, label: "Other", calories: 100 });
    const sorted = rows.slice(0, -1).map((r) => r.calories);
    expect(sorted).toEqual([...sorted].sort((a, b) => b - a));
  });

  it("splits plants, eggs and meat", () => {
    const rows = mixByDiet([of("roti", 300), of("egg_boiled", 150), of("chicken_curry", 350)], lookup);
    expect(Object.fromEntries(rows.map((r) => [r.key, r.calories]))).toEqual({ meat: 350, plant: 300, egg: 150 });
  });

  it("names cuisines readably", () => {
    expect(cuisineLabel("north_indian")).toBe("North Indian");
    expect(cuisineLabel("pan_indian")).toBe("Everyday Indian");
    expect(mixByCuisine([of("roti", 100)], lookup)[0].label.length).toBeGreaterThan(0);
  });

  it("returns nothing for an empty log", () => {
    expect(mixByCategory([], lookup)).toEqual([]);
  });
});

describe("treats", () => {
  it("counts sweets, fast food and fizzy drinks, not everyday food", () => {
    expect(isTreat(lookup("gulab_jamun")!)).toBe(true);
    expect(isTreat(lookup("coca_cola")!)).toBe(true);
    expect(isTreat(lookup("roti")!)).toBe(false);
    expect(isTreat(lookup("dal_tadka")!)).toBe(false);
  });

  it("gives the share of known calories that were treats", () => {
    expect(treatShare([of("roti", 300), of("gulab_jamun", 100), of("not_a_food", 999)], lookup)).toBeCloseTo(100 / 400, 9);
    expect(treatShare([of("not_a_food", 100)], lookup)).toBeNull();
  });
});
