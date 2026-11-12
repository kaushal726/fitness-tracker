import { describe, expect, it } from "vitest";
import { clampReminder, DEFAULT_REMINDERS, reminderMinutes } from "./reminders.ts";

describe("meal reminders", () => {
  it("are sent to the push server as minutes of the day, in meal order", () => {
    expect(reminderMinutes(DEFAULT_REMINDERS.times)).toEqual([510, 810, 1020, 1230]);
  });

  it("stay on the quarter hour and inside the day", () => {
    expect(clampReminder(8.6)).toBe(8.5);
    expect(clampReminder(-1)).toBe(0);
    expect(clampReminder(30)).toBe(23.75);
  });
});
