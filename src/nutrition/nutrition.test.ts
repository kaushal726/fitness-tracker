import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import indexJson from "../../data/food-index.json" with { type: "json" };
import { calculateDailyNutrition, calculateMealNutrition, calculateNutrition, FoodCalcError, toGrams } from "./calculate.ts";
import { DATA_FILES } from "./dataFiles.ts";
import { getAllFoods, getFoodById, getFoodsByCategory, getFoodsByCuisine, getFoodsByTag } from "./registry.ts";
import { searchFood } from "./search.ts";
import { resolveUnitId } from "./units.ts";
import { atwaterCalories, validateDataset } from "./validation.ts";

const DATA_DIR = fileURLToPath(new URL("../../data/foods", import.meta.url));
const MIN_FOODS = 500;

const ids = (query: string, limit = 5) => searchFood(query, { limit }).map((f) => f.id);

describe("dataset", () => {
  it("has no validation errors and at least the target number of foods", () => {
    const errors = validateDataset().filter((i) => i.level === "error");
    expect(errors).toEqual([]);
    expect(getAllFoods().length).toBeGreaterThanOrEqual(MIN_FOODS);
  });

  it("lists every data file in dataFiles.ts", () => {
    const onDisk = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", "")).sort();
    expect(DATA_FILES.map((f) => f.name).sort()).toEqual(onDisk);
  });

  it("keeps food-index.json in sync (run npm run build:index after changing foods)", () => {
    expect(indexJson.foods.map((f) => f.id)).toEqual(getAllFoods().map((f) => f.id));
  });

  it("flags a calorie value far from what the macros give", () => {
    expect(atwaterCalories({ calories: 900, protein: 10, carbohydrates: 10, fat: 10, fiber: 0, sugar: 0, sodium: 0 })).toBeCloseTo(170, 0);
  });

  it("looks foods up by id, category, cuisine and tag", () => {
    expect(getFoodById("plain_dosa")?.name).toBe("Plain Dosa");
    expect(getFoodsByCategory("fruits").length).toBeGreaterThan(20);
    expect(getFoodsByCuisine("bengali").length).toBeGreaterThan(10);
    expect(getFoodsByTag("high_protein").every((f) => f.tags.includes("high_protein"))).toBe(true);
  });
});

describe("units", () => {
  it("understands the way people type them", () => {
    expect(resolveUnitId("Cups")).toBe("cup");
    expect(resolveUnitId("gms")).toBe("g");
    expect(resolveUnitId("chapati")).toBe("roti");
    expect(resolveUnitId("tablespoons")).toBe("tbsp");
    expect(resolveUnitId("nonsense")).toBeNull();
  });
});

describe("calculation", () => {
  it("scales a serving: 2 dosa from 168 kcal/100 g and 80 g each", () => {
    expect(calculateNutrition("plain_dosa", 1, "dosa").calories).toBe(134);
    expect(calculateNutrition("plain_dosa", 2, "piece").calories).toBe(269);
  });

  it("handles grams, and a chicken breast example", () => {
    const n = calculateNutrition("chicken_breast", 200, "g");
    expect(n.calories).toBe(330);
    expect(n.protein).toBe(62);
    expect(n.carbs).toBe(0);
  });

  it("converts ml with the drink's density and treats zero-sugar cola as ~0 kcal", () => {
    expect(calculateNutrition("diet_cola", 250, "ml").calories).toBe(0);
    expect(toGrams("milk", 250, "ml")).toBeCloseTo(257.5, 1);
  });

  it("uses the food's own serving over the generic table", () => {
    expect(toGrams("steamed_rice", 1, "cup")).toBe(150);
    expect(toGrams("cooking_oil", 1, "tbsp")).toBeCloseTo(13.8, 1);
  });

  it("explains why a quantity cannot be sized", () => {
    expect(() => calculateNutrition("nope", 1, "g")).toThrow(FoodCalcError);
    expect(() => calculateNutrition("plain_dosa", 1, "handful")).toThrowError(expect.objectContaining({ code: "unsupported_unit" }));
    expect(() => calculateNutrition("plain_dosa", 1, "zzz")).toThrowError(expect.objectContaining({ code: "unknown_unit" }));
    expect(() => calculateNutrition("plain_dosa", -1, "g")).toThrowError(expect.objectContaining({ code: "invalid_quantity" }));
  });

  it("builds composite foods from their ingredients", () => {
    const shake = getFoodById("protein_shake");
    expect(shake?.type).toBe("composite");
    const whey = calculateNutrition("whey_protein", 1, "scoop");
    const milk = calculateNutrition("milk", 250, "ml");
    const whole = calculateNutrition("protein_shake", 1, "glass");
    expect(Math.abs(whole.calories - (whey.calories + milk.calories))).toBeLessThanOrEqual(2);
    expect(Math.abs(whole.protein - (whey.protein + milk.protein))).toBeLessThanOrEqual(0.5);
  });

  it("sums a meal and a day, and reports what is left", () => {
    const breakfast = [
      { foodId: "egg_boiled", quantity: 2, unit: "egg" },
      { foodId: "roti", quantity: 2, unit: "chapati" },
      { foodId: "milk_tea", quantity: 1, unit: "cup" },
    ];
    const meal = calculateMealNutrition(breakfast);
    expect(meal.totals.calories).toBeGreaterThan(380);
    expect(meal.totals.calories).toBeLessThan(480);
    const day = calculateDailyNutrition(
      [{ mealType: "breakfast", items: breakfast }, { mealType: "lunch", items: [{ foodId: "steamed_rice", quantity: 1, unit: "katori" }] }],
      { calories: 2000, protein: 100, carbs: 250, fat: 60, fiber: 30, sugar: 50, sodium: 2300 },
    );
    expect(day.totals.calories).toBeCloseTo(meal.totals.calories + 195, 0);
    expect(day.remaining?.calories).toBeCloseTo(2000 - day.totals.calories, 0);
  });
});

describe("search", () => {
  it("puts the plain food first for a bare word", () => {
    expect(ids("chicken")[0]).toBe("chicken_breast");
    expect(ids("banana")[0]).toBe("banana");
    expect(ids("paneer")[0]).toBe("paneer");
    expect(ids("dal")[0]).toBe("dal");
  });

  it("finds spelling and naming variants", () => {
    for (const q of ["roti", "chapati", "chapathi", "rotti", "phulka"]) expect(ids(q, 3)).toContain("roti");
    for (const q of ["pani puri", "golgappa", "gol gappa", "puchka", "water balls"]) expect(ids(q, 3)).toContain("pani_puri");
    for (const q of ["chai", "milk tea", "tea"]) expect(ids(q, 4)).toContain("milk_tea");
    expect(ids("maggi", 3)).toContain("instant_noodles");
    expect(ids("diet coke", 3)[0]).toBe("diet_cola");
    expect(ids("coke", 3)).toContain("cola");
  });

  it("ignores word order and understands spelling of chilli", () => {
    expect(ids("chilli chicken", 3)).toContain("chilli_chicken_dry");
    expect(ids("chicken chili", 3)).toContain("chilli_chicken_dry");
    expect(ids("boiled chicken", 3)[0]).toBe("chicken_breast_boiled");
    expect(ids("chicken wrap", 3)[0]).toBe("chicken_wrap");
    expect(ids("paneer tikka", 3)[0]).toBe("paneer_tikka");
    expect(ids("french fries", 3)[0]).toBe("french_fries");
  });

  it("tolerates typos", () => {
    expect(ids("panner", 5)).toContain("paneer");
    expect(ids("chiken", 8).some((id) => id.startsWith("chicken"))).toBe(true);
  });

  it("returns a useful shortlist for common words", () => {
    expect(ids("dosa", 5)).toEqual(expect.arrayContaining(["plain_dosa", "masala_dosa"]));
    expect(ids("burger", 5).some((id) => id.includes("burger"))).toBe(true);
    expect(ids("momos", 4).some((id) => id.includes("momos"))).toBe(true);
    expect(ids("biryani", 3)).toContain("chicken_biryani");
    expect(ids("pizza", 4).some((id) => id.includes("pizza"))).toBe(true);
    expect(ids("protein", 6).length).toBeGreaterThan(0);
  });

  it("boosts favourites and recents, applies filters and searches custom foods", () => {
    const plain = ids("rice", 10);
    const boosted = searchFood("rice", { limit: 10, favoriteIds: ["lemon_rice"] }).map((f) => f.id);
    expect(boosted.indexOf("lemon_rice")).toBeLessThan(plain.indexOf("lemon_rice") === -1 ? 99 : plain.indexOf("lemon_rice") + 1);
    expect(searchFood("rice", { category: "chinese", limit: 20 }).every((f) => f.category === "chinese")).toBe(true);
    const custom = { ...(getFoodById("roti") as NonNullable<ReturnType<typeof getFoodById>>), id: "custom_zzz", name: "Zzz Special", aliases: [], searchableText: "zzz special" };
    expect(searchFood("zzz", { extraFoods: [custom] })[0]?.id).toBe("custom_zzz");
  });

  it("returns nothing for an empty query", () => {
    expect(searchFood("   ")).toEqual([]);
  });
});
