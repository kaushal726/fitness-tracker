import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./store.ts";
import { migrateSettings } from "./settingsMigration.ts";

/** Settings as an older version saved them: a single water goal, no custom one. */
const { customWaterGoalMl: _unused, ...WITHOUT_NEW_GOAL } = DEFAULT_SETTINGS;
const old = (waterGoalMl: number) => ({ ...WITHOUT_NEW_GOAL, waterGoalMl });

describe("settings from an older version", () => {
  it("reads the old default water goal as never set, so the goal is worked out from the body", () => {
    expect(migrateSettings(old(2000), DEFAULT_SETTINGS).customWaterGoalMl).toBeNull();
  });

  it("keeps any other old water goal as one the person set", () => {
    const migrated = migrateSettings(old(3000), DEFAULT_SETTINGS);
    expect(migrated.customWaterGoalMl).toBe(3000);
    expect("waterGoalMl" in migrated).toBe(false);
  });

  it("keeps a goal of 2000 that was set by hand after the change", () => {
    expect(migrateSettings({ ...DEFAULT_SETTINGS, customWaterGoalMl: 2000 }, DEFAULT_SETTINGS).customWaterGoalMl).toBe(2000);
  });

  it("does not let an old goal replace one already chosen in the new setting", () => {
    expect(migrateSettings({ ...DEFAULT_SETTINGS, customWaterGoalMl: null, waterGoalMl: 3500 } as never, DEFAULT_SETTINGS).customWaterGoalMl).toBeNull();
  });

  it("fills in what is missing from the defaults", () => {
    expect(migrateSettings(null, DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS);
    expect(migrateSettings(undefined, DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS);
  });
});
