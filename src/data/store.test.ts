import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { defaultPortion, convertQuantity, portionOptions, portionText } from "../domain/portions.ts";
import { createCustomFood, getFoodById } from "../nutrition/index.ts";
import type { Food } from "../nutrition/types.ts";
import { parseBackup } from "./backup.ts";
import { getAll, getValue, setValue, STORE } from "./db.ts";
import { buildEntry, reviseEntry } from "./entries.ts";
import { frequentFoodIds, groupByMeal, makeFoodLookup, recentFoodIds, sumEntries } from "./selectors.ts";
import { addCustomFood, addEntry, DEFAULT_SETTINGS, exportBackup, getState, initStore, removeEntry, replaceEntry, resetAll, restoreBackup, saveSettings, toggleFavorite } from "./store.ts";
import type { Entry } from "./types.ts";

const food = (id: string): Food => getFoodById(id) as Food;
const at = (h: number, m = 0) => new Date(2026, 0, 5, h, m);

describe("portions", () => {
  it("offers the food's own servings plus grams, and ml for drinks", () => {
    expect(portionOptions(food("plain_dosa")).map((o) => o.unit)).toEqual(["piece", "plate", "g"]);
    expect(portionOptions(food("milk")).map((o) => o.unit)).toContain("ml");
    expect(portionOptions(food("plain_dosa"))[0].label).toBe("dosa");
    expect(portionOptions(food("plain_dosa"))[1].label).toBe("plate (2 dosa)");
  });

  it("words a portion the way people say it", () => {
    expect(portionText(food("plain_dosa"), 2, "piece")).toBe("2 dosa");
    expect(portionText(food("chicken_breast"), 200, "g")).toBe("200 g");
    expect(portionText(food("steamed_rice"), 1.5, "katori")).toBe("1.5 katori");
  });

  it("remembers the last portion, and keeps the amount when the unit changes", () => {
    expect(defaultPortion(food("steamed_rice"))).toEqual({ quantity: 1, unit: "katori" });
    expect(defaultPortion(food("steamed_rice"), { quantity: 2, unit: "cup" })).toEqual({ quantity: 2, unit: "cup" });
    expect(defaultPortion(food("steamed_rice"), { quantity: 2, unit: "nonsense" })).toEqual({ quantity: 1, unit: "katori" });
    expect(convertQuantity(food("steamed_rice"), 1, "katori", "g")).toBe(150);
    expect(convertQuantity(food("steamed_rice"), 300, "g", "katori")).toBe(2);
  });
});

describe("entries", () => {
  it("freezes nutrition at save time and picks the meal from the clock", () => {
    const e = buildEntry({ food: food("plain_dosa"), quantity: 2, unit: "piece", meal: null, settings: DEFAULT_SETTINGS, now: at(8, 32) });
    expect(e).toMatchObject({ meal: "breakfast", date: "2026-01-05", portionText: "2 dosa", grams: 160 });
    expect(e.nutrition.calories).toBe(269);
    expect(buildEntry({ food: food("roti"), quantity: 1, unit: "piece", meal: "dinner", settings: DEFAULT_SETTINGS, now: at(8) }).meal).toBe("dinner");
    const revised = reviseEntry(e, food("plain_dosa"), 1, "piece", "lunch");
    expect(revised).toMatchObject({ id: e.id, at: e.at, meal: "lunch", portionText: "1 dosa" });
    expect(revised.nutrition.calories).toBe(134);
  });

  it("summarises a day", () => {
    const list: Entry[] = [
      buildEntry({ food: food("egg_boiled"), quantity: 2, unit: "egg", meal: null, settings: DEFAULT_SETTINGS, now: at(8) }),
      buildEntry({ food: food("steamed_rice"), quantity: 1, unit: "katori", meal: null, settings: DEFAULT_SETTINGS, now: at(13) }),
      buildEntry({ food: food("egg_boiled"), quantity: 1, unit: "egg", meal: null, settings: DEFAULT_SETTINGS, now: at(20) }),
    ];
    expect(groupByMeal(list).breakfast).toHaveLength(1);
    expect(groupByMeal(list).snack).toHaveLength(0);
    expect(sumEntries(list).calories).toBe(list.reduce((s, e) => s + e.nutrition.calories, 0));
    expect(recentFoodIds(list, 5)).toEqual(["egg_boiled", "steamed_rice"]);
    expect(frequentFoodIds(list, 1, "2026-01-06")).toEqual(["egg_boiled"]);
  });
});

describe("store", () => {
  it("saves, loads back, edits, deletes and restores through IndexedDB", async () => {
    await initStore();
    expect(getState().ready).toBe(true);
    const e = buildEntry({ food: food("banana"), quantity: 1, unit: "banana", meal: null, settings: DEFAULT_SETTINGS, now: at(16, 30) });
    addEntry(e);
    replaceEntry({ ...e, quantity: 2 });
    toggleFavorite("banana");
    const custom = createCustomFood({ id: "custom_x", name: "Amma's Sambar", servingLabel: "1 bowl", calories: 150, protein: 6, carbs: 20, fat: 4, fiber: 5 });
    addCustomFood(custom);
    expect(makeFoodLookup(getState().customFoods)("custom_x")?.name).toBe("Amma's Sambar");
    await new Promise((r) => setTimeout(r, 30));

    const stored = await getAll<Entry>(STORE.entries);
    expect(stored.find((x) => x.id === e.id)?.quantity).toBe(2);
    expect((await getAll<Food>(STORE.customFoods)).map((f) => f.id)).toEqual(["custom_x"]);

    const backup = exportBackup();
    const parsed = parseBackup(JSON.stringify(backup));
    expect(parsed?.entries).toHaveLength(1);
    expect(parseBackup("not json")).toBeNull();
    expect(parseBackup(JSON.stringify({ app: "other" }))).toBeNull();

    expect(removeEntry(e.id)?.id).toBe(e.id);
    expect(getState().entries).toHaveLength(0);
    resetAll();
    expect(getState().favorites).toEqual([]);
    restoreBackup(parsed!);
    await new Promise((r) => setTimeout(r, 30));
    expect(getState().entries).toHaveLength(1);
    expect((await getAll<Entry>(STORE.entries)).length).toBe(1);
  });

  it("reads settings saved before newer options existed, and keeps the thought's date", async () => {
    await setValue("settings", { mealStartHours: DEFAULT_SETTINGS.mealStartHours, customCalories: 1800 });
    await initStore();
    expect(getState().settings).toEqual({ ...DEFAULT_SETTINGS, customCalories: 1800 });
    expect(getState().settings).toMatchObject({ dailyThought: true, lastThoughtDate: null });

    saveSettings({ lastThoughtDate: "2026-01-05" });
    await new Promise((r) => setTimeout(r, 30));
    expect(await getValue("settings")).toMatchObject({ customCalories: 1800, dailyThought: true, lastThoughtDate: "2026-01-05" });
  });

  it("lets a custom food be logged like any other", () => {
    const custom = createCustomFood({ id: "custom_y", name: "Home Ladoo", servingLabel: "1 ladoo", calories: 180, protein: 3, carbs: 22, fat: 9, fiber: 1 });
    const entry = buildEntry({ food: custom, quantity: 2, unit: "serving", meal: "snack", settings: DEFAULT_SETTINGS, now: at(17) });
    expect(entry.nutrition.calories).toBe(360);
    expect(portionOptions(custom).map((o) => o.unit)).toEqual(["serving"]);
    expect(entry.portionText).toBe("2 ladoo");
  });
});
