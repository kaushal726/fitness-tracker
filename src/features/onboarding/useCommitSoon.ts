import { useCallback, useEffect, useRef } from "react";

const DEFAULT_DELAY_MS = 260;

/**
 * For one-tap choices: show the pick for a beat, then move on. The callback is read at the moment it
 * fires, so it sees the answer that was just stored.
 */
export function useCommitSoon(onCommit: () => void, delay = DEFAULT_DELAY_MS): () => void {
  const latest = useRef(onCommit);
  latest.current = onCommit;
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => latest.current(), delay);
  }, [delay]);
}
