/* The app starts on its first screen with nothing moving: no opening screen, no fading in, no ring drawing
 * itself. Only that first screen is instant. What comes after it (another tab, a food that was just added)
 * moves the way it always does.
 */
import { useState } from "react";

let instant = true;

/** True while the first screen is being drawn. */
export const isInstantArrival = (): boolean => instant;

/** Called once that first screen is on the page: from here on, animations play as usual. */
export function endInstantArrival(): void {
  instant = false;
}

/** For a component that animates in when it appears: false only on the first screen. Decided once per mount. */
export function useAnimatesIn(): boolean {
  return useState(() => !instant)[0];
}
