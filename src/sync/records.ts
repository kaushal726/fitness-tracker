/* The app's data as a list of small records, the shape the cloud keeps it in: one record for each food entry, each custom
 * food, each day's water and weight, each favourite, each remembered portion, and two for the profile and the settings.
 * Everything here is pure: the same data always gives the same records, and applying records gives back plain data.
 */
import type { Entry, LastUsed, Profile, Settings } from "../data/types.ts";
import type { WeightLog } from "../domain/weighIns.ts";
import type { WaterLog } from "../domain/water.ts";
import type { Food } from "../nutrition/types.ts";

export type RecordKind = "entry" | "customFood" | "water" | "weight" | "favorite" | "lastUsed" | "doc";
export type DocId = "profile" | "settings";

export type RecordData = Record<string, unknown>;

/** One record. `data` is null when it was deleted. */
export interface SyncRecord {
  kind: RecordKind;
  id: string;
  data: RecordData | null;
}

/** All the data a person has: what is kept in the cloud and on the phone. */
export interface SyncData {
  profile: Profile | null;
  settings: Settings;
  entries: Entry[];
  customFoods: Food[];
  favorites: string[];
  lastUsed: Record<string, LastUsed>;
  water: WaterLog;
  weights: WeightLog;
}

export const recordKey = (kind: RecordKind, id: string): string => `${kind}:${id}`;

/** Every record the data is made of, by key. A deleted record is simply absent. */
export function toRecords(data: SyncData): Map<string, SyncRecord> {
  const records = new Map<string, SyncRecord>();
  const put = (kind: RecordKind, id: string, value: RecordData) => records.set(recordKey(kind, id), { kind, id, data: value });
  for (const entry of data.entries) put("entry", entry.id, entry as unknown as RecordData);
  for (const food of data.customFoods) put("customFood", food.id, food as unknown as RecordData);
  for (const [date, ml] of Object.entries(data.water)) put("water", date, { value: ml });
  for (const [date, kg] of Object.entries(data.weights)) put("weight", date, { value: kg });
  // A favourite keeps its place in the list: the first one has the highest rank.
  data.favorites.forEach((foodId, index) => put("favorite", foodId, { at: data.favorites.length - index }));
  for (const [foodId, portion] of Object.entries(data.lastUsed)) put("lastUsed", foodId, portion as unknown as RecordData);
  if (data.profile) put("doc", "profile", data.profile as unknown as RecordData);
  put("doc", "settings", data.settings as unknown as RecordData);
  return records;
}

const asNumber = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);

/** The data after applying records that came from the cloud: each one replaces its own, a deleted one removes its own. */
export function applyRecords(data: SyncData, changes: SyncRecord[], migrateSettings: (saved: Partial<Settings>) => Settings): SyncData {
  const entries = new Map(data.entries.map((e) => [e.id, e]));
  const customFoods = new Map(data.customFoods.map((f) => [f.id, f]));
  const water = { ...data.water };
  const weights = { ...data.weights };
  const lastUsed = { ...data.lastUsed };
  const favoriteRank = new Map(data.favorites.map((id, index) => [id, data.favorites.length - index]));
  let { profile, settings } = data;

  for (const { kind, id, data: value } of changes) {
    switch (kind) {
      case "entry":
        if (value) entries.set(id, value as unknown as Entry);
        else entries.delete(id);
        break;
      case "customFood":
        if (value) customFoods.set(id, value as unknown as Food);
        else customFoods.delete(id);
        break;
      case "water": {
        const ml = asNumber(value?.value);
        if (ml !== null && ml > 0) water[id] = ml;
        else delete water[id];
        break;
      }
      case "weight": {
        const kg = asNumber(value?.value);
        if (kg !== null && kg > 0) weights[id] = kg;
        else delete weights[id];
        break;
      }
      case "favorite": {
        const rank = asNumber(value?.at);
        if (value && rank !== null) favoriteRank.set(id, rank);
        else favoriteRank.delete(id);
        break;
      }
      case "lastUsed":
        if (value) lastUsed[id] = value as unknown as LastUsed;
        else delete lastUsed[id];
        break;
      case "doc":
        if (id === "profile") profile = value ? (value as unknown as Profile) : null;
        else if (id === "settings" && value) settings = migrateSettings(value as Partial<Settings>);
        break;
    }
  }

  return {
    profile,
    settings,
    entries: [...entries.values()],
    customFoods: [...customFoods.values()],
    favorites: [...favoriteRank].sort((a, b) => b[1] - a[1]).map(([id]) => id),
    lastUsed,
    water,
    weights,
  };
}
