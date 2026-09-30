/* The loaded dataset. Built once on first use; foods are immutable after that. */
import { DATA_FILES } from "./dataFiles.ts";
import { hydrateComposite, hydrateSimple, isComposite } from "./loader.ts";
import type { Food } from "./types.ts";

interface Registry {
  foods: Food[];
  byId: Map<string, Food>;
}

let registry: Registry | null = null;

function build(): Registry {
  const byId = new Map<string, Food>();
  const foods: Food[] = [];
  const add = (food: Food) => {
    if (byId.has(food.id)) return; // duplicates are reported by validation, first one wins
    byId.set(food.id, food);
    foods.push(food);
  };
  for (const { name, data } of DATA_FILES) {
    for (const raw of data.foods) if (!isComposite(raw)) add(hydrateSimple(raw, data, name));
  }
  for (const { name, data } of DATA_FILES) {
    for (const raw of data.foods) if (isComposite(raw)) add(hydrateComposite(raw, data, name, (id) => byId.get(id)));
  }
  return { foods, byId };
}

function get(): Registry {
  registry ??= build();
  return registry;
}

export function getAllFoods(): readonly Food[] {
  return get().foods;
}

export function getFoodById(id: string): Food | undefined {
  return get().byId.get(id);
}

export function getFoodsByCategory(category: string): Food[] {
  return get().foods.filter((f) => f.category === category);
}

export function getFoodsByCuisine(cuisine: string): Food[] {
  return get().foods.filter((f) => f.cuisine === cuisine);
}

export function getFoodsByTag(tag: string): Food[] {
  return get().foods.filter((f) => f.tags.includes(tag));
}
