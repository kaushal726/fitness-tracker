/* How big the app's text is. Every text size in the stylesheets is its design size times --fs-scale, so this is the one
 * knob: chosen in Profile, remembered on this phone, applied before the first screen is drawn.
 */
import { useSyncExternalStore } from "react";

export type TextSize = "small" | "medium" | "large";

export const TEXT_SIZE_KEY = "fitly_text_size";
const SCALES: Record<TextSize, number> = { small: 0.82, medium: 0.9, large: 1 };
const DEFAULT_SIZE: TextSize = "medium";

const listeners = new Set<() => void>();
let choice: TextSize = read();

function read(): TextSize {
  try {
    const saved = localStorage.getItem(TEXT_SIZE_KEY);
    return saved && saved in SCALES ? (saved as TextSize) : DEFAULT_SIZE;
  } catch {
    return DEFAULT_SIZE;
  }
}

function apply(): void {
  document.documentElement.style.setProperty("--fs-scale", String(SCALES[choice]));
}

export function initTextSize(): void {
  apply();
}

export function setTextSize(next: TextSize): void {
  choice = next;
  try {
    localStorage.setItem(TEXT_SIZE_KEY, next);
  } catch {
    // The choice still holds for this visit.
  }
  apply();
  listeners.forEach((l) => l());
}

export function useTextSize(): TextSize {
  return useSyncExternalStore((l) => {
    listeners.add(l);
    return () => void listeners.delete(l);
  }, () => choice);
}
