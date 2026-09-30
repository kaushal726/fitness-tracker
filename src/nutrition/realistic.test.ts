import { describe, expect, it } from "vitest";
import { calculateMealNutrition, calculateNutrition } from "./calculate.ts";
import { searchFood } from "./search.ts";

/** What a person types, the food it should find, and a sane calorie range for the amount. */
const CASES: [query: string, id: string, quantity: number, unit: string, min: number, max: number][] = [
  ["eggs", "egg_boiled", 2, "egg", 140, 170],
  ["chapati", "roti", 2, "chapati", 190, 230],
  ["chai", "milk_tea", 1, "cup", 70, 110],
  ["boiled chicken", "chicken_breast_boiled", 200, "g", 280, 320],
  ["rice", "steamed_rice", 1, "cup", 170, 220],
  ["chicken wrap", "chicken_wrap", 1, "piece", 380, 460],
  ["diet coke", "diet_cola", 250, "ml", 0, 5],
  ["dosa", "plain_dosa", 2, "dosa", 240, 300],
  ["sambar", "sambar", 1, "katori", 70, 110],
  ["chutney", "coconut_chutney", 2, "tbsp", 40, 70],
  ["burger", "veg_burger", 1, "piece", 320, 420],
  ["french fries", "french_fries", 1, "serving", 300, 380],
  ["cola", "cola", 330, "ml", 130, 160],
  ["protein shake", "protein_shake", 1, "glass", 240, 320],
  ["banana", "banana", 1, "banana", 95, 125],
  ["coffee", "coffee_milk_sugar", 1, "cup", 70, 110],
  ["green tea", "green_tea", 1, "cup", 0, 5],
  ["pizza", "veg_pizza", 2, "slice", 450, 600],
  ["momos", "veg_momos", 6, "piece", 180, 240],
  ["paneer tikka", "paneer_tikka", 5, "piece", 300, 420],
  ["chicken chili", "chilli_chicken_dry", 1, "plate", 400, 520],
  ["maggi", "instant_noodles", 1, "packet", 280, 340],
  ["biryani", "chicken_biryani", 1, "plate", 520, 720],
];

describe("realistic inputs", () => {
  it.each(CASES)("%s is found and sized sensibly", (query, id, quantity, unit, min, max) => {
    expect(searchFood(query, { limit: 8 }).map((f) => f.id)).toContain(id);
    const { calories } = calculateNutrition(id, quantity, unit);
    expect(calories).toBeGreaterThanOrEqual(min);
    expect(calories).toBeLessThanOrEqual(max);
  });

  it("adds up a whole meal typed as several foods", () => {
    const meal = calculateMealNutrition([
      { foodId: "egg_boiled", quantity: 2, unit: "egg" },
      { foodId: "roti", quantity: 2, unit: "chapati" },
      { foodId: "milk_tea", quantity: 1, unit: "cup" },
    ]);
    expect(meal.totals.calories).toBeGreaterThan(400);
    expect(meal.totals.calories).toBeLessThan(500);
    expect(meal.totals.protein).toBeGreaterThan(20);
  });
});
