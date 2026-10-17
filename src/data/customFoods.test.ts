import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import type { Food } from "../nutrition/types.ts";
import { createCustomFood } from "../nutrition/custom.ts";
import { getAll, STORE } from "./db.ts";
import { addCustomFood, deleteCustomFood, getState, initStore, resetAll, toggleFavorite, updateCustomFood } from "./store.ts";

const make = (id: string, name: string, calories: number): Food => createCustomFood({ id, name, servingLabel: "1 bowl", calories, protein: 5, carbs: 10, fat: 2, fiber: 1 });
const settle = () => new Promise((resolve) => setTimeout(resolve, 60));

describe("foods of your own in the store", () => {
  beforeEach(async () => {
    await resetAll();
    await initStore();
  });

  it("replaces a food by its id when it is changed, and keeps the rest", async () => {
    addCustomFood(make("custom_a", "Amma Sambar", 120));
    addCustomFood(make("custom_b", "Raita", 60));
    updateCustomFood(createCustomFood({ id: "custom_a", name: "Amma Sambar", servingLabel: "1 katori", calories: 150, protein: 6, carbs: 20, fat: 4, fiber: 3, sugar: 4, sodium: 300 }));
    const [a, b] = getState().customFoods;
    expect(a).toMatchObject({ id: "custom_a", servingOptions: [{ label: "1 katori" }], nutritionPer100g: { calories: 150, sugar: 4, sodium: 300 } });
    expect(b).toMatchObject({ id: "custom_b", nutritionPer100g: { calories: 60 } });
    await settle();
    const saved = await getAll<Food>(STORE.customFoods);
    expect(saved.find((f) => f.id === "custom_a")?.nutritionPer100g.calories).toBe(150);
    expect(saved).toHaveLength(2);
  });

  it("removes a deleted food from the list, the favourites and the saved data", async () => {
    addCustomFood(make("custom_a", "Amma Sambar", 120));
    toggleFavorite("custom_a");
    deleteCustomFood("custom_a");
    expect(getState().customFoods).toEqual([]);
    expect(getState().favorites).not.toContain("custom_a");
    await settle();
    expect(await getAll(STORE.customFoods)).toEqual([]);
  });
});
