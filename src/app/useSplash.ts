import { useCallback, useEffect, useState } from "react";
import { prefersReducedMotion } from "../lib/motion.ts";
import { readingTimeMs } from "../quotes/opening.ts";
import type { Quote } from "../quotes/types.ts";

const MIN_VISIBLE_MS = 1500;
const EXIT_MS = 380;
/** The thought fades in once the name has settled. */
export const THOUGHT_DELAY_MS = 1000;

export type SplashPhase = "showing" | "leaving" | "done";

/** How long the opening screen stays: the animation alone, or the animation and then time to read a thought. */
export function splashHoldMs(thought: Quote | null): number {
  return thought ? THOUGHT_DELAY_MS + readingTimeMs(thought) : MIN_VISIBLE_MS;
}

/**
 * The opening animation stays for `holdMs`, and never leaves before the app's data has loaded. `skip` moves
 * on early. People who asked their device for less motion skip it entirely.
 */
export function useSplash(ready: boolean, holdMs: number): { phase: SplashPhase; skip: () => void } {
  const [startedAt] = useState(() => performance.now());
  const [phase, setPhase] = useState<SplashPhase>(() => (prefersReducedMotion() ? "done" : "showing"));

  useEffect(() => {
    if (phase !== "showing" || !ready) return;
    const remaining = Math.max(0, holdMs - (performance.now() - startedAt));
    const timer = window.setTimeout(() => setPhase("leaving"), remaining);
    return () => window.clearTimeout(timer);
  }, [phase, ready, holdMs, startedAt]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = window.setTimeout(() => setPhase("done"), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const skip = useCallback(() => setPhase((current) => (current === "showing" ? "leaving" : current)), []);
  return { phase, skip };
}
