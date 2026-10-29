import { afterEach, describe, expect, it, vi } from "vitest";
import { installGuide, readSnoozedUntil, SNOOZE_DAYS, SNOOZE_KEY, shouldOfferInstall, snoozeInstall } from "./installNudge.ts";

const NOW = Date.UTC(2026, 9, 29, 10);
const DAY = 86_400_000;
const phone = { standalone: false, mobile: true, snoozedUntil: null, now: NOW };

describe("shouldOfferInstall", () => {
  it("offers it to someone on a phone, in the browser, who has not said Not now", () => {
    expect(shouldOfferInstall(phone)).toBe(true);
  });

  it("does not offer it in the installed app, or on a computer", () => {
    expect(shouldOfferInstall({ ...phone, standalone: true })).toBe(false);
    expect(shouldOfferInstall({ ...phone, mobile: false })).toBe(false);
  });

  it("waits while Not now holds, and asks again once it has run out", () => {
    expect(shouldOfferInstall({ ...phone, snoozedUntil: NOW + DAY })).toBe(false);
    expect(shouldOfferInstall({ ...phone, snoozedUntil: NOW })).toBe(true);
    expect(shouldOfferInstall({ ...phone, snoozedUntil: NOW - DAY })).toBe(true);
  });
});

function stubStorage(initial: Record<string, string> = {}, blocked = false) {
  const store = new Map(Object.entries(initial));
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => {
      if (blocked) throw new Error("Storage is blocked");
      return store.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      if (blocked) throw new Error("Storage is blocked");
      store.set(key, value);
    },
  });
  return store;
}

describe("Not now", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is remembered for a few days", () => {
    const store = stubStorage();
    expect(readSnoozedUntil()).toBeNull();
    snoozeInstall(NOW);
    expect(store.get(SNOOZE_KEY)).toBe(String(NOW + SNOOZE_DAYS * DAY));
    expect(readSnoozedUntil()).toBe(NOW + SNOOZE_DAYS * DAY);
  });

  it("ignores what is not a time", () => {
    for (const junk of ["", "soon", "-5", "0"]) {
      stubStorage({ [SNOOZE_KEY]: junk });
      expect(readSnoozedUntil(), junk).toBeNull();
    }
  });

  it("still works for the visit when storage is blocked", () => {
    stubStorage({}, true);
    expect(readSnoozedUntil()).toBeNull();
    expect(() => snoozeInstall(NOW)).not.toThrow();
  });
});

describe("installGuide", () => {
  it("shows the steps where the browser has no install button", () => {
    expect(installGuide({ ios: true, firefoxAndroid: false })).toBe("ios");
    expect(installGuide({ ios: false, firefoxAndroid: true })).toBe("menu");
  });

  it("shows nothing for a browser that sends its own prompt, or none at all", () => {
    expect(installGuide({ ios: false, firefoxAndroid: false })).toBeNull();
  });
});
