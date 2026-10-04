import { describe, expect, it } from "vitest";
import type { Targets } from "../data/types.ts";
import { popularFoods } from "../nutrition/search.ts";
import type { NutritionTotals } from "../nutrition/types.ts";
import { random } from "../test/random.ts";
import { dayGaps, dayIdeas } from "./ideas.ts";

const TARGETS: Targets = { calories: 2000, protein: 120, carbs: 230, fat: 55, fiber: 30 };
const totals = (patch: Partial<NutritionTotals>): NutritionTotals => ({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, ...patch });
const pool = popularFoods();

describe("what is off about the day", () => {
  it("flags a day over its calories at any hour, and protein and fibre only late", () => {
    expect(dayGaps(totals({ calories: 2300, protein: 120, fiber: 30 }), TARGETS, 11).map((g) => g.nutrient)).toEqual(["calories"]);
    expect(dayGaps(totals({ calories: 900, protein: 30, fiber: 5 }), TARGETS, 11)).toEqual([]);
    expect(dayGaps(totals({ calories: 1200, protein: 30, fiber: 5 }), TARGETS, 19).map((g) => g.nutrient)).toEqual(["protein", "fiber"]);
  });

  it("says nothing about a day that is on course", () => {
    expect(dayGaps(totals({ calories: 1900, protein: 110, fiber: 28 }), TARGETS, 21)).toEqual([]);
    expect(dayIdeas(totals({ calories: 1900, protein: 110, fiber: 28 }), TARGETS, 21, pool)).toEqual([]);
  });

  it("measures the shortfall and the excess", () => {
    expect(dayGaps(totals({ calories: 2300 }), TARGETS, 10)[0]).toEqual({ nutrient: "calories", kind: "over", amount: 300, eaten: 2300, goal: 2000 });
    expect(dayGaps(totals({ calories: 1500, protein: 40, fiber: 30 }), TARGETS, 19)[0]).toEqual({ nutrient: "protein", kind: "short", amount: 80, eaten: 40, goal: 120 });
  });
});

describe("ideas", () => {
  it("offers protein-rich foods that fit, one of each kind, for a day short of protein", () => {
    const [group] = dayIdeas(totals({ calories: 1500, protein: 40, fiber: 30 }), TARGETS, 19, pool);
    expect(group?.gap.nutrient).toBe("protein");
    expect(group?.foods.length).toBeGreaterThanOrEqual(2);
    expect(group?.foods.length).toBeLessThanOrEqual(4);
    for (const idea of group?.foods ?? []) {
      expect(idea.adds).toBeGreaterThanOrEqual(5);
      expect(idea.calories).toBeLessThanOrEqual(500 * 0.6);
      expect(idea.adds).toBe(idea.food.nutritionPerServing.protein);
    }
    const names = (group?.foods ?? []).map((i) => i.food.name);
    expect(names.filter((n) => /chicken/i.test(n))).toHaveLength(Math.min(1, names.filter((n) => /chicken/i.test(n)).length));
    expect((group?.foods ?? []).filter((i) => !i.vegetarian).length).toBeLessThanOrEqual(2);
  });

  it("keeps to what the day has room for", () => {
    const [group] = dayIdeas(totals({ calories: 1900, protein: 40, fiber: 30 }), TARGETS, 20, pool);
    for (const idea of group?.foods ?? []) expect(idea.calories).toBeLessThanOrEqual(150);
  });

  it("offers fibre-rich foods for a day short of fibre", () => {
    const groups = dayIdeas(totals({ calories: 1500, protein: 120, fiber: 6 }), TARGETS, 19, pool);
    expect(groups[0]?.gap.nutrient).toBe("fiber");
    for (const idea of groups[0]?.foods ?? []) expect(idea.food.nutritionPerServing.fiber).toBeGreaterThanOrEqual(2.5);
  });

  it("offers light foods that are still worth eating for a day over its calories", () => {
    const [group] = dayIdeas(totals({ calories: 2400, protein: 120, fiber: 30 }), TARGETS, 21, pool);
    expect(group?.gap.kind).toBe("over");
    expect(group?.foods.length).toBeGreaterThan(0);
    for (const idea of group?.foods ?? []) {
      expect(idea.calories).toBeLessThanOrEqual(120);
      expect(idea.food.nutritionPerServing.protein + idea.food.nutritionPerServing.fiber).toBeGreaterThanOrEqual(2);
    }
  });

  it("never suggests raw ingredients, condiments, supplements or alcohol, whatever the day looks like", () => {
    for (let seed = 1; seed <= 80; seed++) {
      const rand = random(seed);
      const day = totals({ calories: Math.round(rand() * 3200), protein: Math.round(rand() * 150), fiber: Math.round(rand() * 40) });
      for (const group of dayIdeas(day, TARGETS, 17 + Math.floor(rand() * 7), pool)) {
        expect(group.foods.length).toBeLessThanOrEqual(4);
        for (const { food } of group.foods) {
          expect(["condiments", "staples", "supplements"]).not.toContain(food.category);
          expect(food.subCategory).not.toBe("alcohol");
          expect(food.name).not.toMatch(/\b(raw|powder|flour|dry|dried)\b/i);
          if (food.category === "vegetables") expect(["salad", "boiled"]).toContain(food.subCategory);
        }
      }
    }
  });
});
