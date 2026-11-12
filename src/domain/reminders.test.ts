import { describe, expect, it } from "vitest";
import { clampReminder, DEFAULT_REMINDERS, DEFAULT_WATER_REMINDERS, reminderMinutes, reminderPlan, waterReminderHours } from "./reminders.ts";

describe("meal reminders", () => {
  it("are minutes of the day, in meal order", () => {
    expect(reminderMinutes(DEFAULT_REMINDERS.times)).toEqual([510, 810, 1020, 1230]);
  });

  it("stay on the quarter hour and inside the day", () => {
    expect(clampReminder(8.6)).toBe(8.5);
    expect(clampReminder(-1)).toBe(0);
    expect(clampReminder(30)).toBe(23.75);
  });
});

describe("water reminders", () => {
  it("run from the first time to the last, every so often", () => {
    expect(waterReminderHours(DEFAULT_WATER_REMINDERS)).toEqual([9, 11, 13, 15, 17, 19, 21]);
    expect(waterReminderHours({ enabled: true, from: 10, to: 13, everyHours: 1.5 })).toEqual([10, 11.5, 13]);
    expect(waterReminderHours({ enabled: true, from: 20, to: 9, everyHours: 1 })).toEqual([]);
  });
});

describe("the day's reminders", () => {
  it("holds only what is on, in time order, and a meal wins a shared minute", () => {
    const meals = { ...DEFAULT_REMINDERS, enabled: true };
    const water = { enabled: true, from: 13.5, to: 14.5, everyHours: 1 };
    expect(reminderPlan(meals, water).map((r) => [r.minute, r.kind])).toEqual([[510, "meal"], [810, "meal"], [870, "water"], [1020, "meal"], [1230, "meal"]]);
    expect(reminderPlan({ ...meals, enabled: false }, { ...water, enabled: false })).toEqual([]);
  });
});
