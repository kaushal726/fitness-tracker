import { afterEach, describe, expect, it, vi } from "vitest";
import { isAndroid, isFirefoxAndroid, isIos, isMobileDevice } from "./device.ts";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";
const ANDROID_CHROME = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";
const ANDROID_FIREFOX = "Mozilla/5.0 (Android 14; Mobile; rv:125.0) Gecko/125.0 Firefox/125.0";
const WINDOWS_CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function device(userAgent: string, platform = "", maxTouchPoints = 0): void {
  vi.stubGlobal("navigator", { userAgent, platform, maxTouchPoints });
}

describe("device", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("knows an iPhone, and an iPad that calls itself a Mac", () => {
    device(IPHONE, "iPhone", 5);
    expect([isIos(), isAndroid(), isMobileDevice()]).toEqual([true, false, true]);
    device(MAC, "MacIntel", 5);
    expect(isIos()).toBe(true);
  });

  it("does not take a real Mac for an iPad", () => {
    device(MAC, "MacIntel", 0);
    expect([isIos(), isMobileDevice()]).toEqual([false, false]);
  });

  it("knows Android, and Firefox on it", () => {
    device(ANDROID_CHROME, "Linux armv8l", 5);
    expect([isAndroid(), isMobileDevice(), isFirefoxAndroid()]).toEqual([true, true, false]);
    device(ANDROID_FIREFOX, "Linux armv8l", 5);
    expect(isFirefoxAndroid()).toBe(true);
  });

  it("does not take a computer for a phone", () => {
    device(WINDOWS_CHROME, "Win32", 0);
    expect([isIos(), isAndroid(), isMobileDevice()]).toEqual([false, false, false]);
  });
});
