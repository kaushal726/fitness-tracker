import { useEffect, useState } from "react";
import { saveSettings } from "../data/store.ts";
import type { Settings } from "../data/types.ts";
import { prefersReducedMotion } from "../lib/motion.ts";
import { openingThought } from "../quotes/opening.ts";
import type { Quote } from "../quotes/types.ts";

interface Decision {
  thought: Quote | null;
  date: string;
}

/**
 * Decides once, the moment the saved data is known, whether this launch opens with a thought, and notes the
 * day so that opening the app again the same day does not repeat it.
 */
export function useOpeningThought(ready: boolean, hasProfile: boolean, settings: Settings, today: string): Quote | null {
  const [decision, setDecision] = useState<Decision | null>(null);
  if (ready && decision === null) {
    setDecision({ thought: openingThought({ hasProfile, settings, today, reducedMotion: prefersReducedMotion() }), date: today });
  }

  useEffect(() => {
    if (decision?.thought) saveSettings({ lastThoughtDate: decision.date });
  }, [decision]);

  return decision?.thought ?? null;
}
