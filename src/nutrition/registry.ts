/* The loaded dataset. The data files are one lazy chunk (dataFiles.ts) that the app asks for after
 * the first screen with loadFoods(); scripts and tests call it (or setDataFiles) before using anything
 * else here. Foods are immutable once loaded.
 */
import { hydrateComposite, hydrateSimple, isComposite } from "./loader.ts";
import type { DataFile, Food } from "./types.ts";

interface Registry {
  foods: Food[];
  byId: Map<string, Food>;
}

let registry: Registry | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function build(files: readonly DataFile[]): Registry {
  const byId = new Map<string, Food>();
  const foods: Food[] = [];
  const add = (food: Food) => {
    if (byId.has(food.id)) return; // duplicates are reported by validation, first one wins
    byId.set(food.id, food);
    foods.push(food);
  };
  for (const { name, data } of files) {
    for (const raw of data.foods) if (!isComposite(raw)) add(hydrateSimple(raw, data, name));
  }
  for (const { name, data } of files) {
    for (const raw of data.foods) if (isComposite(raw)) add(hydrateComposite(raw, data, name, (id) => byId.get(id)));
  }
  return { foods, byId };
}

/** Builds the registry from data files that are already imported. */
export function setDataFiles(files: readonly DataFile[]): void {
  registry = build(files);
  listeners.forEach((listener) => listener());
}

/** Fetches the data files (once) and builds the registry. A failed download can be retried by calling it again. */
export function loadFoods(): Promise<void> {
  if (registry) return Promise.resolve();
  loading ??= import("./dataFiles.ts").then(
    ({ DATA_FILES }) => setDataFiles(DATA_FILES),
    (error: unknown) => {
      loading = null;
      throw error;
    },
  );
  return loading;
}

export function foodsLoaded(): boolean {
  return registry !== null;
}

/** Calls `listener` when the foods arrive. Returns the function that stops listening. */
export function onFoodsLoaded(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function get(): Registry {
  if (!registry) throw new Error("The food data is not loaded yet: await loadFoods() first.");
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
