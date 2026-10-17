import { describe, expect, it } from "vitest";
import { createCustomFood } from "./custom.ts";
import { searchFood, searchFoodDetailed } from "./search.ts";

const ids = (query: string, limit = 5) => searchFood(query, { limit }).map((f) => f.id);

describe("search when no food has every word typed", () => {
  it("leaves out words that describe the food or the amount, and finds the food", () => {
    for (const q of ["homemade curd", "home made curd", "fresh curd", "1 katori curd", "2 bowl curd"]) {
      const r = searchFoodDetailed(q, { limit: 5 });
      expect(r.foods.map((f) => f.id), q).toContain("curd");
      expect(r.closest, q).toBe(true);
    }
  });

  it("finds the plain food when a descriptive word is also in some names", () => {
    expect(ids("plain curd", 8)).toContain("curd");
  });

  it("leaves out a word that is in no food, and finds the rest", () => {
    expect(ids("curd zzqxj")).toContain("curd");
    expect(searchFoodDetailed("dal zzqxj").closest).toBe(true);
  });

  it("finds nothing when every word is unknown, or only an amount was typed", () => {
    expect(searchFood("zzqxj plorfk")).toEqual([]);
    expect(searchFood("1 bowl")).toEqual([]);
    expect(searchFood("2 katori")).toEqual([]);
  });

  it("offers foods that match some of the words when none has them all", () => {
    const r = searchFoodDetailed("rasmalai sambar", { limit: 10 });
    expect(r.closest).toBe(true);
    expect(r.foods.length).toBeGreaterThan(0);
    expect(r.foods.every((f) => /rasmalai|sambar/.test(`${f.name} ${f.aliases.join(" ")} ${f.searchableText}`.toLowerCase()))).toBe(true);
  });

  it("does not change a search that matched every word", () => {
    const r = searchFoodDetailed("dal tadka");
    expect(r.closest).toBe(false);
    expect(r.foods[0]?.id).toBe("dal_tadka");
    expect(searchFoodDetailed("curd").closest).toBe(false);
  });

  it("still finds the user's own foods", () => {
    const own = createCustomFood({ id: "custom_x", name: "Amma Sambar", servingLabel: "1 bowl", calories: 120, protein: 5, carbs: 18, fat: 3, fiber: 4 });
    expect(searchFood("homemade amma sambar", { limit: 3, extraFoods: [own] })[0]?.id).toBe("custom_x");
  });
});

describe("custom foods", () => {
  it("keep sugar and sodium when given, and default them to zero", () => {
    const full = createCustomFood({ id: "custom_a", name: "A", servingLabel: "1 cup", calories: 100, protein: 1, carbs: 20, fat: 1, fiber: 2, sugar: 12, sodium: 340 });
    expect(full.nutritionPer100g).toMatchObject({ sugar: 12, sodium: 340 });
    expect(full.servingOptions[0].label).toBe("1 cup");
    const plain = createCustomFood({ id: "custom_b", name: "B", servingLabel: "1 serving", calories: 100, protein: 1, carbs: 20, fat: 1, fiber: 2 });
    expect(plain.nutritionPer100g).toMatchObject({ sugar: 0, sodium: 0 });
  });
});
