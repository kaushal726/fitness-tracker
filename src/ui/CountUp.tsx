import { useEffect, useRef, useState } from "react";
import { formatNumber } from "../lib/format";
import { prefersReducedMotion } from "../lib/motion";

const DEFAULT_DURATION_MS = 700;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

interface CountUpProps {
  value: number;
  /** Start counting from here on first paint. Omit to show the value straight away. */
  from?: number;
  format?: (n: number) => string;
  /** Milliseconds the count takes. */
  duration?: number;
}

/** A number that counts to its new value instead of jumping. */
export function CountUp({ value, from, format = formatNumber, duration = DEFAULT_DURATION_MS }: CountUpProps) {
  const [shown, setShown] = useState(from ?? value);
  const shownRef = useRef(shown);
  shownRef.current = shown;

  useEffect(() => {
    if (prefersReducedMotion() || shownRef.current === value) {
      setShown(value);
      return;
    }
    const start = shownRef.current;
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration);
      setShown(start + (value - start) * easeOutCubic(t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <>{format(shown)}</>;
}
