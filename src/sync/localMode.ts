/* Whether this phone chose to keep its data on the phone alone instead of signing in. Remembered, so the sign-in screen is
 * not shown again; Profile offers to sign in whenever the person changes their mind.
 */
import { useSyncExternalStore } from "react";

export const LOCAL_ONLY_KEY = "fitly_local_only";

const listeners = new Set<() => void>();
let local = read();

function read(): boolean {
  try {
    return localStorage.getItem(LOCAL_ONLY_KEY) === "1";
  } catch {
    return false;
  }
}

export const getLocalOnly = (): boolean => local;

export function setLocalOnly(next: boolean): void {
  local = next;
  try {
    if (next) localStorage.setItem(LOCAL_ONLY_KEY, "1");
    else localStorage.removeItem(LOCAL_ONLY_KEY);
  } catch {
    // The choice still holds for this visit.
  }
  listeners.forEach((l) => l());
}

export function useLocalOnly(): boolean {
  return useSyncExternalStore((l) => {
    listeners.add(l);
    return () => void listeners.delete(l);
  }, getLocalOnly);
}
