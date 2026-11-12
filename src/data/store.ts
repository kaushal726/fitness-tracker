/* App state in memory, mirrored to IndexedDB. Reads are synchronous once loaded; every write
 * updates memory first (so the screen is instant) and then persists.
 */
import { useSyncExternalStore } from "react";
import { DEFAULT_MEAL_STARTS } from "../domain/meals.ts";
import { stampWeight } from "../domain/profileWeight.ts";
import { DEFAULT_GLASS_ML, DEFAULT_WATER_GOAL_ML, withWater, type WaterLog } from "../domain/water.ts";
import { withWeighIn, type WeightLog } from "../domain/weighIns.ts";
import { DEFAULT_REMINDERS, DEFAULT_WATER_REMINDERS } from "../domain/reminders.ts";
import { todayISO } from "../lib/dates.ts";
import type { Food } from "../nutrition/types.ts";
import { deleteRecord, getAll, getValue, putRecord, replaceEverything, setValue, STORE } from "./db.ts";
import type { Backup, Entry, LastUsed, Profile, Settings } from "./types.ts";

export interface AppState {
  ready: boolean;
  profile: Profile | null;
  settings: Settings;
  entries: Entry[];
  customFoods: Food[];
  favorites: string[];
  lastUsed: Record<string, LastUsed>;
  water: WaterLog;
  weights: WeightLog;
}

const KEY = { profile: "profile", settings: "settings", favorites: "favorites", lastUsed: "lastUsed", water: "water", weights: "weights" } as const;
export const DEFAULT_SETTINGS: Settings = { mealStartHours: DEFAULT_MEAL_STARTS, customCalories: null, waterGoalMl: DEFAULT_WATER_GOAL_ML, waterGlassMl: DEFAULT_GLASS_ML, reminders: DEFAULT_REMINDERS, waterReminders: DEFAULT_WATER_REMINDERS };

let state: AppState = { ready: false, profile: null, settings: DEFAULT_SETTINGS, entries: [], customFoods: [], favorites: [], lastUsed: {}, water: {}, weights: {} };
const listeners = new Set<() => void>();
const errorListeners = new Set<() => void>();

function set(patch: Partial<AppState>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

/** Runs a save; a failure (storage full or blocked) is reported once to whoever is listening. */
function persist(work: () => Promise<void>): void {
  work().catch(() => errorListeners.forEach((l) => l()));
}

export function getState(): AppState {
  return state;
}

export function useAppState(): AppState {
  return useSyncExternalStore((l) => {
    listeners.add(l);
    return () => void listeners.delete(l);
  }, getState);
}

export function onStorageError(listener: () => void): () => void {
  errorListeners.add(listener);
  return () => void errorListeners.delete(listener);
}

export async function initStore(): Promise<void> {
  try {
    const [entries, customFoods, profile, settings, favorites, lastUsed, water, weights] = await Promise.all([
      getAll<Entry>(STORE.entries),
      getAll<Food>(STORE.customFoods),
      getValue<Profile>(KEY.profile),
      getValue<Settings>(KEY.settings),
      getValue<string[]>(KEY.favorites),
      getValue<Record<string, LastUsed>>(KEY.lastUsed),
      getValue<WaterLog>(KEY.water),
      getValue<WeightLog>(KEY.weights),
    ]);
    set({
      ready: true,
      entries,
      customFoods,
      profile: profile ?? null,
      settings: { ...DEFAULT_SETTINGS, ...settings },
      favorites: favorites ?? [],
      lastUsed: lastUsed ?? {},
      water: water ?? {},
      weights: weights ?? {},
    });
  } catch {
    // Storage is blocked (private window, no space): the app still works for this session.
    set({ ready: true });
    errorListeners.forEach((l) => l());
  }
}

/** Saves the profile. A new or changed weight also goes in the weight log, on today. */
export function saveProfile(next: Profile): void {
  const today = todayISO();
  const profile = stampWeight(next, state.profile, today);
  const previous = state.profile;
  const weighed = previous === null || previous.weightKg !== profile.weightKg;
  let weights = state.weights;
  if (weighed) {
    // The weight being replaced keeps its own day in the log, so a weight entered before the log existed is not lost.
    if (previous?.weightDate && weights[previous.weightDate] === undefined) weights = withWeighIn(weights, previous.weightDate, previous.weightKg);
    weights = withWeighIn(weights, today, profile.weightKg);
  }
  set({ profile, weights });
  persist(() => setValue(KEY.profile, profile));
  if (weighed) persist(() => setValue(KEY.weights, weights));
}

export function saveSettings(patch: Partial<Settings>): void {
  const settings = { ...state.settings, ...patch };
  set({ settings });
  persist(() => setValue(KEY.settings, settings));
}

export function addEntry(entry: Entry): void {
  set({ entries: [...state.entries, entry] });
  persist(() => putRecord(STORE.entries, entry));
}

export function replaceEntry(entry: Entry): void {
  set({ entries: state.entries.map((e) => (e.id === entry.id ? entry : e)) });
  persist(() => putRecord(STORE.entries, entry));
}

export function removeEntry(id: string): Entry | undefined {
  const removed = state.entries.find((e) => e.id === id);
  if (!removed) return undefined;
  set({ entries: state.entries.filter((e) => e.id !== id) });
  persist(() => deleteRecord(STORE.entries, id));
  return removed;
}

export function toggleFavorite(foodId: string): void {
  const favorites = state.favorites.includes(foodId) ? state.favorites.filter((f) => f !== foodId) : [foodId, ...state.favorites];
  set({ favorites });
  persist(() => setValue(KEY.favorites, favorites));
}

export function rememberPortion(foodId: string, portion: LastUsed): void {
  const lastUsed = { ...state.lastUsed, [foodId]: portion };
  set({ lastUsed });
  persist(() => setValue(KEY.lastUsed, lastUsed));
}

/** Adds water to a day, or takes some back with a negative amount. */
export function addWater(date: string, deltaMl: number): void {
  const water = withWater(state.water, date, deltaMl);
  set({ water });
  persist(() => setValue(KEY.water, water));
}

export function addCustomFood(food: Food): void {
  set({ customFoods: [...state.customFoods, food] });
  persist(() => putRecord(STORE.customFoods, food));
}

export function updateCustomFood(food: Food): void {
  set({ customFoods: state.customFoods.map((f) => (f.id === food.id ? food : f)) });
  persist(() => putRecord(STORE.customFoods, food));
}

export function deleteCustomFood(id: string): void {
  set({ customFoods: state.customFoods.filter((f) => f.id !== id), favorites: state.favorites.filter((f) => f !== id) });
  persist(async () => {
    await deleteRecord(STORE.customFoods, id);
    await setValue(KEY.favorites, state.favorites);
  });
}

function toBackup(s: AppState): Backup {
  return {
    app: "fitly",
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: s.profile,
    settings: s.settings,
    entries: s.entries,
    customFoods: s.customFoods,
    favorites: s.favorites,
    lastUsed: s.lastUsed,
    water: s.water,
    weights: s.weights,
  };
}

export function exportBackup(): Backup {
  return toBackup(state);
}

/** Replaces all data with the backup's. The caller has already checked it with parseBackup. */
export function restoreBackup(backup: Backup): void {
  set({
    profile: backup.profile,
    settings: { ...DEFAULT_SETTINGS, ...backup.settings },
    entries: backup.entries,
    customFoods: backup.customFoods,
    favorites: backup.favorites,
    lastUsed: backup.lastUsed,
    water: backup.water ?? {},
    weights: backup.weights ?? {},
  });
  persist(() => replaceEverything(storedShape(state)));
}

export function resetAll(): void {
  set({ profile: null, settings: DEFAULT_SETTINGS, entries: [], customFoods: [], favorites: [], lastUsed: {}, water: {}, weights: {} });
  persist(() => replaceEverything(storedShape(state)));
}

function storedShape(s: AppState) {
  const kv: Record<string, unknown> = { [KEY.settings]: s.settings, [KEY.favorites]: s.favorites, [KEY.lastUsed]: s.lastUsed, [KEY.water]: s.water, [KEY.weights]: s.weights };
  if (s.profile) kv[KEY.profile] = s.profile;
  return { entries: s.entries, customFoods: s.customFoods, kv };
}
