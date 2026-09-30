import { useEffect, useState } from "react";
import { isInstantArrival } from "../lib/arrival.ts";
import { prefersReducedMotion } from "../lib/motion.ts";

const MIN_VISIBLE_MS = 1500;
const EXIT_MS = 380;

export type SplashPhase = "showing" | "leaving" | "done";

/**
 * The opening animation stays long enough to be seen, and never leaves before the app's data has
 * loaded. It is skipped for people who asked their device for less motion, and when the page is reloaded.
 */
export function useSplash(ready: boolean): SplashPhase {
  const [skip] = useState(() => prefersReducedMotion() || isInstantArrival());
  const [phase, setPhase] = useState<SplashPhase>(skip ? "done" : "showing");
  const [waited, setWaited] = useState(skip);

  useEffect(() => {
    if (skip) return;
    const timer = window.setTimeout(() => setWaited(true), MIN_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [skip]);

  useEffect(() => {
    if (phase === "showing" && ready && waited) setPhase("leaving");
  }, [phase, ready, waited]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = window.setTimeout(() => setPhase("done"), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  return phase;
}
