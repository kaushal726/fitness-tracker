import { describe, expect, it } from "vitest";
import { searchFood, searchFoodDetailed } from "./search.ts";

const names = (query: string, limit = 5) => searchFood(query, { limit }).map((f) => f.name);
const topIs = (query: string, expected: string) => expect(names(query, 3), query).toContain(expected);

describe("search reads a mistyped or misheard word as the one meant", () => {
  it("finds the veg sandwiches for 'wet sandwich' and says what it searched", () => {
    const r = searchFoodDetailed("wet sandwich", { limit: 5 });
    expect(r.foods[0].name).toBe("Veg Sandwich");
    expect(r.corrected).toBe("veg sandwich");
    expect(r.closest).toBe(false);
  });

  it("repairs both words when both are off", () => {
    expect(searchFoodDetailed("vegg sandwitch").foods[0].name).toBe("Veg Sandwich");
  });

  it("splits two words typed as one", () => {
    expect(searchFoodDetailed("paneertikka").corrected).toBe("paneer tikka");
    topIs("paneertikka", "Paneer Tikka");
  });

  it("hears a respelling of a sound as the word it stands for", () => {
    expect(searchFoodDetailed("rajma chaval").foods[0].name).toBe("Rajma Chawal");
  });

  it("does not guess when the words were already right", () => {
    expect(searchFoodDetailed("veg sandwich").corrected).toBeUndefined();
    expect(searchFoodDetailed("masala dosa").corrected).toBeUndefined();
  });

  it("still finds nothing for gibberish", () => {
    expect(searchFood("xyzzy qq")).toEqual([]);
  });
});

describe("search tolerates the usual ways of typing a dish", () => {
  const cases: [string, string][] = [
    ["butter chikan", "Butter Chicken"],
    ["egg curi", "Egg Curry"],
    ["hakka noodels", "Veg Hakka Noodles"],
    ["chiz sandwich", "Cheese Sandwich"],
    ["vedge burger", "Veg Burger"],
    ["panner tika", "Paneer Tikka"],
    ["gulab jaman", "Gulab Jamun"],
    ["masla dosa", "Masala Dosa"],
    ["aloo pratha", "Aloo Paratha"],
    ["bisibele bhat", "Bisi Bele Bath"],
  ];
  it.each(cases)("%s finds %s", (query, food) => topIs(query, food));
});

describe("search ignores how many was typed", () => {
  it("finds the food for Hindi and digit counts", () => {
    for (const q of ["2 egg", "do egg", "teen roti", "3 roti"]) expect(searchFood(q, { limit: 3 }).length, q).toBeGreaterThan(0);
    expect(names("2 egg", 3)).toContain("Boiled Egg");
    expect(names("teen roti", 3)).toContain("Roti");
  });

  it("keeps a number that is part of the name", () => {
    expect(names("chicken 65", 3)[0]).toMatch(/65/);
  });
});
