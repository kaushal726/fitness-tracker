import { createContext, useContext, useState } from "react";

/** True while a page (the add page) is open over the screen. */
export const CoveredContext = createContext(false);

/**
 * The value as it was when the screen was covered, until it is uncovered. Food added on the page over Today is then not
 * seen arriving behind it: it arrives, and its numbers count and its rings draw, when the page is gone.
 */
export function useHeldWhileCovered<T>(value: T): T {
  const covered = useContext(CoveredContext);
  const [held, setHeld] = useState(value);
  if (!covered && held !== value) setHeld(value);
  return covered ? held : value;
}
