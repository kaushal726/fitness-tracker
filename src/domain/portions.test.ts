import { describe, expect, it } from "vitest";
import { getFoodById } from "../nutrition/registry.ts";
import type { Food } from "../nutrition/types.ts";
import { portionNutrition } from "./portions.ts";

const roti = getFoodById("roti") as Food;

describe("portionNutrition", () => {
  it("works out what a portion comes to", () => {
    expect(portionNutrition(roti, 3, "roti")?.calories).toBe(318);
    expect(portionNutrition(roti, 120, "g")?.calories).toBe(318);
  });

  it("is null for an amount that cannot be used, or a unit the food does not have", () => {
    for (const quantity of [0, -1, Number.NaN]) expect(portionNutrition(roti, quantity, "roti")).toBeNull();
    expect(portionNutrition(roti, 1, "no_such_unit")).toBeNull();
  });
});
