/* A page that was reloaded should look finished the moment it appears: no opening screen, no fading in, no ring
 * drawing itself. Only that first screen is instant. What comes after it (another tab, a food that was just
 * added) moves the way it always does.
 */
import { useState } from "react";

function wasReloaded(): boolean {
  const [navigation] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  return navigation?.type === "reload";
}

let instant = wasReloaded();

/** True while the first screen of a reloaded page is being drawn. */
export const isInstantArrival = (): boolean => instant;

/** Called once that first screen is on the page: from here on, animations play as usual. */
export function endInstantArrival(): void {
  instant = false;
}

/** For a component that animates in when it appears: false only on the first screen after a reload. Decided once per mount. */
export function useAnimatesIn(): boolean {
  return useState(() => !instant)[0];
}
