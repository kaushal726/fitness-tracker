/* When to ask people to put the app on their phone: on a phone or tablet, in a browser tab (not the installed app already),
 * and, once they said "Not now", not again for a few days.
 */
export const SNOOZE_KEY = "fitly_install_snoozed_until";
export const SNOOZE_DAYS = 3;
/** Long enough for the first screen to be seen before anything covers it. */
export const SHOW_AFTER_MS = 1500;
const DAY_MS = 86_400_000;

export interface Situation {
  /** Opened from the home screen already. */
  standalone: boolean;
  mobile: boolean;
  /** When "Not now" runs out, in ms; null if it was never said. */
  snoozedUntil: number | null;
  now: number;
}

export function shouldOfferInstall({ standalone, mobile, snoozedUntil, now }: Situation): boolean {
  return mobile && !standalone && (snoozedUntil === null || now >= snoozedUntil);
}

export function readSnoozedUntil(): number | null {
  try {
    const until = Number(localStorage.getItem(SNOOZE_KEY));
    return Number.isFinite(until) && until > 0 ? until : null;
  } catch {
    return null;
  }
}

export function snoozeInstall(now: number = Date.now()): void {
  try {
    localStorage.setItem(SNOOZE_KEY, String(now + SNOOZE_DAYS * DAY_MS));
  } catch {
    // Without storage it simply asks again next visit.
  }
}

/** How to install by hand where the browser has no prompt to show: Safari on iPhone and iPad, Firefox on Android. */
export type InstallGuide = "ios" | "menu";

export function installGuide({ ios, firefoxAndroid }: { ios: boolean; firefoxAndroid: boolean }): InstallGuide | null {
  if (ios) return "ios";
  return firefoxAndroid ? "menu" : null;
}
