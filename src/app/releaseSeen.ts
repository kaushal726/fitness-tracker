/* Which release's note this phone has already shown, so the pop-up comes once per release.
 *
 * Someone who opens the app for the first time has no use for "what's new": while they are still in onboarding the
 * newest release is marked seen. Someone who used the app before this existed has no mark and is shown the note once.
 */
import { useSyncExternalStore } from "react";

export const RELEASE_SEEN_KEY = "fitly_release_seen";

const listeners = new Set<() => void>();
let seen: string | null = read();

function read(): string | null {
  try {
    return localStorage.getItem(RELEASE_SEEN_KEY);
  } catch {
    return null;
  }
}

export function markReleaseSeen(version: string): void {
  seen = version;
  try {
    localStorage.setItem(RELEASE_SEEN_KEY, version);
  } catch {
    // Without storage the note is shown again next visit.
  }
  listeners.forEach((l) => l());
}

export function hasSeenAnyRelease(): boolean {
  return seen !== null;
}

export function useSeenRelease(): string | null {
  return useSyncExternalStore((l) => {
    listeners.add(l);
    return () => void listeners.delete(l);
  }, () => seen);
}

/** The pop-up is for someone who has a profile already and has not seen the newest note. */
export function shouldShowReleaseNotes({ seen: seenVersion, latest, hasProfile }: { seen: string | null; latest: string; hasProfile: boolean }): boolean {
  return hasProfile && seenVersion !== latest;
}
