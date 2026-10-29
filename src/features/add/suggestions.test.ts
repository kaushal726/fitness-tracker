import { describe, expect, it } from "vitest";
import { makeFoodLookup } from "../../data/selectors.ts";
import type { Entry } from "../../data/types.ts";
import { addDays } from "../../lib/dates.ts";
import { ZERO_TOTALS } from "../../nutrition/constants.ts";
import type { Food, MealType } from "../../nutrition/types.ts";
import { buildSuggestions } from "./suggestions.ts";

const TODAY = "2026-10-21";
const lookup = makeFoodLookup([]);
const food = (id: string): Food => {
  const found = lookup(id);
  if (!found) throw new Error(`No food ${id}`);
  return found;
};
const unitOf = (id: string): string => food(id).servingOptions[0].unit;

let counter = 0;
function log(daysAgo: number, meal: MealType, foodId: string, quantity = 1, unit = unitOf(foodId)): Entry {
  counter += 1;
  return { id: `e${counter}`, date: addDays(TODAY, -daysAgo), at: counter, meal, foodId, name: foodId, quantity, unit, portionText: "", grams: 100, nutrition: ZERO_TOTALS };
}
const onDays = (days: number[], meal: MealType, foodId: string, quantity = 1, unit?: string): Entry[] => days.map((d) => log(d, meal, foodId, quantity, unit));

const build = (history: Entry[], extra: { favorites?: string[]; meal?: MealType } = {}) =>
  buildSuggestions({ history, meal: extra.meal ?? "breakfast", date: TODAY, today: TODAY, favorites: extra.favorites ?? [], customFoods: [], lookup });
const idsOf = (section: { items: { food: Food }[] }): string[] => section.items.map((i) => i.food.id);

describe("buildSuggestions", () => {
  it("offers common foods to someone with no history", () => {
    const sections = build([]);
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe("Popular");
    expect(sections[0].items.every((i) => i.portion === undefined)).toBe(true);
  });

  it("puts what is usually eaten for the meal first, each with the amount usually had", () => {
    const history = [...onDays([1, 2, 3, 4, 5], "breakfast", "roti", 2), ...onDays([1, 2], "breakfast", "banana"), ...onDays([1, 2, 3], "lunch", "steamed_rice")];
    const [usual] = build(history);
    expect(usual.title).toBe("Likely for breakfast");
    expect(idsOf(usual)).toEqual(["roti", "banana"]);
    expect(usual.items[0].portion).toEqual({ quantity: 2, unit: unitOf("roti") });
  });

  it("says which meal it is for", () => {
    expect(build(onDays([1, 2], "dinner", "roti"), { meal: "dinner" })[0].title).toBe("Likely for dinner");
  });

  it("follows the meal: lunch foods do not lead the breakfast list", () => {
    const history = [...onDays([1, 2, 3], "lunch", "steamed_rice"), ...onDays([1, 2], "breakfast", "banana")];
    expect(idsOf(build(history, { meal: "breakfast" })[0])).toEqual(["banana"]);
    expect(idsOf(build(history, { meal: "lunch" })[0])).toEqual(["steamed_rice"]);
  });

  it("shows the rest of their foods below: favourites first, then what they eat at other meals", () => {
    const history = [...onDays([1, 2, 3], "breakfast", "banana"), ...onDays([1, 2, 3, 4], "lunch", "steamed_rice"), ...onDays([1, 2], "dinner", "roti")];
    const [usual, more] = build(history, { favorites: ["egg_boiled"] });
    expect(idsOf(usual)).toEqual(["banana"]);
    expect(more.title).toBe("More of your foods");
    expect(idsOf(more)).toEqual(["egg_boiled", "steamed_rice", "roti"]);
    expect(more.items.every((i) => i.portion === undefined)).toBe(true);
  });

  it("does not offer again what is already in the meal today", () => {
    const history = [...onDays([1, 2, 3], "breakfast", "banana"), ...onDays([1, 2], "breakfast", "roti"), log(0, "breakfast", "banana")];
    const sections = build(history);
    expect(sections.flatMap(idsOf)).not.toContain("banana");
    expect(idsOf(sections[0])).toEqual(["roti"]);
  });

  it("is one list called Your foods when nothing was eaten at this meal yet", () => {
    const sections = build(onDays([1, 2, 3], "lunch", "steamed_rice"));
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe("Your foods");
    expect(idsOf(sections[0])).toEqual(["steamed_rice"]);
  });

  it("offers the usual serving when the amount that was logged no longer fits the food", () => {
    const [usual] = build(onDays([1, 2], "breakfast", "banana", 3, "a_unit_that_is_gone"));
    expect(usual.items[0].portion).toEqual({ quantity: 1, unit: unitOf("banana") });
  });

  it("skips foods that no longer exist, and falls back to common ones when nothing else is left", () => {
    expect(idsOf(build([...onDays([1, 2, 3], "breakfast", "banana"), ...onDays([1, 2, 3, 4], "breakfast", "gone_food", 1, "serving")])[0])).toEqual(["banana"]);
    const sections = build(onDays([1, 2, 3], "breakfast", "gone_food", 1, "serving"));
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe("Popular");
  });

  it("shows no more than six usual foods", () => {
    const ids = ["roti", "banana", "egg_boiled", "milk_tea", "steamed_rice", "protein_shake", "chicken_breast", "paneer_raw"].filter((id) => lookup(id));
    const history = ids.flatMap((id, i) => onDays(Array.from({ length: 10 - i }, (_, d) => d + 1), "breakfast", id));
    expect(build(history)[0].items.length).toBeLessThanOrEqual(6);
    expect(build(history)[0].items.length).toBe(Math.min(6, ids.length));
  });
});

describe("why a food is offered", () => {
  /** The section of foods likely for the meal, when there is one. */
  const likely = (history: Entry[], meal: MealType) => build(history, { meal }).find((section) => section.title.startsWith("Likely for"));
  const find = (history: Entry[], meal: MealType, id: string) => likely(history, meal)?.items.find((i) => i.food.id === id);

  it("brings back at lunch a dish that was eaten at breakfast, in the amount it was had", () => {
    const item = find([log(0, "breakfast", "dal_tadka", 1.5)], "lunch", "dal_tadka");
    expect(item?.reason).toEqual({ kind: "earlier", meal: "breakfast" });
    expect(item?.portion).toEqual({ quantity: 1.5, unit: unitOf("dal_tadka") });
  });

  it("does not bring back a cup of tea only because it was had at breakfast", () => {
    expect(find([log(0, "breakfast", "milk_tea")], "lunch", "milk_tea")).toBeUndefined();
  });

  it("does, once this person has shown they have tea twice a day", () => {
    const history = [...onDays([1, 2, 3, 4, 5, 6], "breakfast", "milk_tea"), ...onDays([1, 2, 3, 4, 5, 6], "snack", "milk_tea"), log(0, "breakfast", "milk_tea")];
    expect(find(history, "snack", "milk_tea")?.reason).toEqual({ kind: "earlier", meal: "breakfast" });
  });

  it("stops offering a dish that this person never eats twice in a day", () => {
    const history = [...onDays([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "breakfast", "dal_tadka"), log(0, "breakfast", "dal_tadka")];
    expect(find(history, "lunch", "dal_tadka")).toBeUndefined();
  });

  it("offers what was left from last night to someone who eats leftovers", () => {
    const history = [...onDays([1, 2, 3, 4, 5, 6, 7, 8, 9], "dinner", "dal_tadka"), ...onDays([1, 2, 3, 4, 5, 6, 7, 8], "lunch", "dal_tadka")];
    expect(find(history, "lunch", "dal_tadka")?.reason).toEqual({ kind: "yesterday" });
  });

  it("names the food it goes with", () => {
    const history = [...onDays([1, 2, 3, 4, 5], "breakfast", "idli", 3), ...onDays([1, 2, 3, 4, 5], "breakfast", "sambar"), ...onDays([6, 7, 8, 9, 10, 11, 12], "breakfast", "poha"), log(0, "breakfast", "idli", 3)];
    const sambar = find(history, "breakfast", "sambar");
    expect(sambar?.reason?.kind).toBe("with");
    expect(sambar?.reason && sambar.reason.kind === "with" && sambar.reason.food.id).toBe("idli");
  });

  it("says when a food belongs to this weekday", () => {
    const wednesdays = [7, 14, 21, 28];
    const history = [...onDays(wednesdays, "breakfast", "upma"), ...onDays([1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13], "breakfast", "poha")];
    expect(find(history, "breakfast", "upma")?.reason).toEqual({ kind: "weekday", date: TODAY });
  });

  it("says nothing extra about a food that is simply usual", () => {
    expect(find(onDays([1, 2, 3, 4, 5, 6], "breakfast", "poha"), "breakfast", "poha")?.reason).toBeUndefined();
  });

  it("puts a carried-over dish among the usual ones by how likely it is", () => {
    const history = [...onDays([1, 2, 3, 4, 5, 6, 7, 8], "lunch", "roti", 2), log(0, "breakfast", "dal_tadka")];
    const ids = idsOf(likely(history, "lunch")!);
    expect(ids).toContain("roti");
    expect(ids).toContain("dal_tadka");
  });
});

