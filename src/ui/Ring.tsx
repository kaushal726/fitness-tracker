import { useEffect, useId, useState, type ReactNode } from "react";
import { useAnimatesIn } from "../lib/arrival";
import { cx } from "../lib/cx";
import styles from "./Ring.module.css";

export type RingTone = "primary" | "over" | "protein" | "carbs" | "fat" | "fiber";

interface RingProps {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  tone?: RingTone;
  label: string;
  /** A soft glow around the arc: for a big ring, not for the small ones. */
  glow?: boolean;
  /** Lets a place restyle the ring's colours (`--ring-from`, `--ring-to`, `--ring-track`). */
  className?: string;
  children?: ReactNode;
}

/** A progress ring that draws itself in when it appears (already drawn when the app starts) and eases to each new value. */
export function Ring({ value, max, size = 152, stroke = 14, tone = "primary", label, glow = false, className, children }: RingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const share = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const drawsIn = useAnimatesIn();
  const [drawn, setDrawn] = useState(drawsIn ? 0 : share);
  // An id for the arc's gradient, without the characters an SVG reference does not like.
  const gradientId = `ring-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(share));
    return () => cancelAnimationFrame(frame);
  }, [share]);

  const center = size / 2;
  return (
    <div className={cx(styles.ring, styles[tone], glow && styles.glow, className)} style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" className={styles.from} />
            <stop offset="1" className={styles.to} />
          </linearGradient>
        </defs>
        <circle className={styles.track} cx={center} cy={center} r={radius} strokeWidth={stroke} fill="none" />
        <circle
          className={styles.arc}
          cx={center}
          cy={center}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - drawn)}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ opacity: drawn > 0 ? 1 : 0 }}
        />
      </svg>
      <div className={styles.center}>{children}</div>
    </div>
  );
}
