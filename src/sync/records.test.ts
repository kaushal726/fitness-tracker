import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../data/store.ts";
import { migrateSettings } from "../data/settingsMigration.ts";
import type { Entry, Profile } from "../data/types.ts";
import { fingerprint } from "./hash.ts";
import { FIRST_LINK_STAMP, planSync } from "./plan.ts";
import { applyRecords, recordKey, toRecords, type SyncData, type SyncRecord } from "./records.ts";

const profile: Profile = { name: "A", age: 30, gender: "female", heightCm: 165, weightKg: 60, goal: "maintain", targetWeightKg: null, weeks: null, activity: "light" };
const entry = (id: string, grams = 100): Entry => ({ id, date: "2026-01-05", at: 1, meal: "lunch", foodId: "roti", name: "Roti", grams, quantity: 1, unit: "piece", nutrition: { calories: 100, protein: 3, carbs: 20, fat: 1, fiber: 2, sugar: 0, sodium: 5 } } as unknown as Entry);
const data = (patch: Partial<SyncData> = {}): SyncData => ({ profile, settings: DEFAULT_SETTINGS, entries: [], customFoods: [], favorites: [], lastUsed: {}, water: {}, weights: {}, ...patch });
const merge = (saved: Partial<typeof DEFAULT_SETTINGS>) => migrateSettings(saved, DEFAULT_SETTINGS);

describe("data as records", () => {
  it("makes one record for each thing and gives the same data back", () => {
    const original = data({
      entries: [entry("e1"), entry("e2", 250)],
      favorites: ["milk", "banana", "roti"],
      lastUsed: { roti: { quantity: 2, unit: "piece" } },
      water: { "2026-01-05": 750 },
      weights: { "2026-01-05": 60.4 },
    });
    const records = [...toRecords(original).values()];
    const rebuilt = applyRecords(data({ profile: null, settings: DEFAULT_SETTINGS }), records, merge);
    expect(rebuilt.entries.map((e) => e.id).sort()).toEqual(["e1", "e2"]);
    expect(rebuilt.favorites).toEqual(["milk", "banana", "roti"]);
    expect(rebuilt.lastUsed).toEqual(original.lastUsed);
    expect(rebuilt.water).toEqual(original.water);
    expect(rebuilt.weights).toEqual(original.weights);
    expect(rebuilt.profile).toEqual(profile);
  });

  it("removes what a deletion names, and nothing else", () => {
    const start = data({ entries: [entry("e1"), entry("e2")], favorites: ["milk", "banana"], water: { "2026-01-05": 500 }, lastUsed: { milk: { quantity: 1, unit: "glass" } } });
    const gone: SyncRecord[] = [
      { kind: "entry", id: "e1", data: null },
      { kind: "favorite", id: "milk", data: null },
      { kind: "water", id: "2026-01-05", data: null },
      { kind: "lastUsed", id: "milk", data: null },
      { kind: "doc", id: "profile", data: null },
    ];
    const next = applyRecords(start, gone, merge);
    expect(next.entries.map((e) => e.id)).toEqual(["e2"]);
    expect(next.favorites).toEqual(["banana"]);
    expect(next.water).toEqual({});
    expect(next.lastUsed).toEqual({});
    expect(next.profile).toBeNull();
  });

  it("ignores a water or weight record that is not a positive number", () => {
    const next = applyRecords(data(), [{ kind: "water", id: "2026-01-05", data: { value: -3 } }, { kind: "weight", id: "2026-01-05", data: { value: "heavy" } }], merge);
    expect(next.water).toEqual({});
    expect(next.weights).toEqual({});
  });

  it("fills in settings an older copy did not have", () => {
    const next = applyRecords(data(), [{ kind: "doc", id: "settings", data: { waterGlassMl: 300 } }], merge);
    expect(next.settings.waterGlassMl).toBe(300);
    expect(next.settings.mealStartHours).toEqual(DEFAULT_SETTINGS.mealStartHours);
  });
});

describe("what to send", () => {
  const current = toRecords(data({ entries: [entry("e1"), entry("e2")] }));
  const savedBase = Object.fromEntries([...current].map(([key, record]) => [key, fingerprint(JSON.stringify(record.data))]));

  it("sends everything, as the oldest edits, the first time the phone is linked", () => {
    const plan = planSync(current, {}, 5000, false);
    expect(plan.changes.length).toBe(current.size);
    expect(plan.changes.every((c) => c.updatedAt === FIRST_LINK_STAMP)).toBe(true);
  });

  it("sends nothing when nothing changed", () => {
    expect(planSync(current, savedBase, 5000, true).changes).toEqual([]);
  });

  it("sends only what was edited, stamped now", () => {
    const edited = toRecords(data({ entries: [entry("e1", 999), entry("e2")] }));
    const plan = planSync(edited, savedBase, 5000, true);
    expect(plan.changes.map((c) => recordKey(c.kind, c.id))).toEqual(["entry:e1"]);
    expect(plan.changes[0].updatedAt).toBe(5000);
  });

  it("sends a deletion for what was saved and is now gone", () => {
    const fewer = toRecords(data({ entries: [entry("e2")] }));
    const plan = planSync(fewer, savedBase, 7000, true);
    expect(plan.changes).toEqual([{ kind: "entry", id: "e1", data: null, updatedAt: 7000 }]);
    expect(plan.nextBase["entry:e1"]).toBeUndefined();
  });

  it("keeps a colon inside an id", () => {
    const base = { "doc:a:b": "x" };
    const plan = planSync(new Map(), base, 1, true);
    expect(plan.changes).toEqual([{ kind: "doc", id: "a:b", data: null, updatedAt: 1 }]);
  });
});
