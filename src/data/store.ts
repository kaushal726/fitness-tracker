/* App state in memory, mirrored to IndexedDB. Reads are synchronous once loaded; every write
 * updates memory first (so the screen is instant) and then persists.
 */
import { useSyncExternalStore } from "react";
import { DEFAULT_MEAL_STARTS } from "../domain/meals.ts";
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
}

const KEY = { profile: "profile", settings: "settings", favorites: "favorites", lastUsed: "lastUsed" } as const;
export const DEFAULT_SETTINGS: Settings = { mealStartHours: DEFAULT_MEAL_STARTS, customCalories: null };

let state: AppState = { ready: false, profile: null, settings: DEFAULT_SETTINGS, entries: [], customFoods: [], favorites: [], lastUsed: {} };
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
    const [entries, customFoods, profile, settings, favorites, lastUsed] = await Promise.all([
      getAll<Entry>(STORE.entries),
      getAll<Food>(STORE.customFoods),
      getValue<Profile>(KEY.profile),
      getValue<Settings>(KEY.settings),
      getValue<string[]>(KEY.favorites),
      getValue<Record<string, LastUsed>>(KEY.lastUsed),
    ]);
    set({
      ready: true,
      entries,
      customFoods,
      profile: profile ?? null,
      settings: { ...DEFAULT_SETTINGS, ...settings },
      favorites: favorites ?? [],
      lastUsed: lastUsed ?? {},
    });
  } catch {
    // Storage is blocked (private window, no space): the app still works for this session.
    set({ ready: true });
    errorListeners.forEach((l) => l());
  }
}

export function saveProfile(profile: Profile): void {
  set({ profile });
  persist(() => setValue(KEY.profile, profile));
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

export function addCustomFood(food: Food): void {
  set({ customFoods: [...state.customFoods, food] });
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
  });
  persist(() => replaceEverything(storedShape(state)));
}

export function resetAll(): void {
  set({ profile: null, settings: DEFAULT_SETTINGS, entries: [], customFoods: [], favorites: [], lastUsed: {} });
  persist(() => replaceEverything(storedShape(state)));
}

function storedShape(s: AppState) {
  const kv: Record<string, unknown> = { [KEY.settings]: s.settings, [KEY.favorites]: s.favorites, [KEY.lastUsed]: s.lastUsed };
  if (s.profile) kv[KEY.profile] = s.profile;
  return { entries: s.entries, customFoods: s.customFoods, kv };
}
