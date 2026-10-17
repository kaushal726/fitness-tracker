/* The colour the app is drawn in: buttons, the calorie ring, the active tab, the tinted cards. The colours themselves are
 * the `[data-accent]` blocks in styles/tokens.css (green, the default, is the plain set), so this module only remembers
 * the choice and writes it to <html data-accent>: chosen in Profile, kept on this phone, applied before the first screen
 * is drawn (index.html does the same a moment earlier, to avoid a flash of green).
 */
import { useSyncExternalStore } from "react";

export type AccentId = "green" | "blue" | "purple" | "orange" | "pink" | "teal";

export interface Accent {
  id: AccentId;
  label: string;
  /** The accent in the light theme, the same as its --primary in tokens.css: the dot in the picker and the colour of the shared picture. */
  color: string;
}

export const ACCENTS: readonly Accent[] = [
  { id: "green", label: "Green", color: "#1b7a56" },
  { id: "blue", label: "Blue", color: "#1a66c0" },
  { id: "purple", label: "Purple", color: "#6a46cc" },
  { id: "orange", label: "Orange", color: "#b04f08" },
  { id: "pink", label: "Pink", color: "#b82e62" },
  { id: "teal", label: "Teal", color: "#0f7681" },
];

export const ACCENT_KEY = "fitly_accent";
export const DEFAULT_ACCENT: AccentId = "green";

const listeners = new Set<() => void>();

const isAccent = (value: string | null): value is AccentId => ACCENTS.some((a) => a.id === value);

function read(): AccentId {
  try {
    const saved = localStorage.getItem(ACCENT_KEY);
    return isAccent(saved) ? saved : DEFAULT_ACCENT;
  } catch {
    return DEFAULT_ACCENT;
  }
}

// After the helpers it reads with: a const used before its line has run throws, and read() would swallow that as "no saved choice".
let choice: AccentId = read();

function apply(): void {
  const root = document.documentElement;
  if (choice === DEFAULT_ACCENT) delete root.dataset.accent;
  else root.dataset.accent = choice;
}

export function accentOf(id: AccentId): Accent {
  return ACCENTS.find((a) => a.id === id) ?? ACCENTS[0];
}

export function initAccent(): void {
  apply();
}

export function setAccent(next: AccentId): void {
  choice = next;
  try {
    localStorage.setItem(ACCENT_KEY, next);
  } catch {
    // The choice still holds for this visit.
  }
  apply();
  listeners.forEach((l) => l());
}

export function useAccent(): AccentId {
  return useSyncExternalStore((l) => {
    listeners.add(l);
    return () => void listeners.delete(l);
  }, () => choice);
}
