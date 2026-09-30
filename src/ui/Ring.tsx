import { useEffect, useState, type ReactNode } from "react";
import { cx } from "../lib/cx";
import styles from "./Ring.module.css";

interface RingProps {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  tone?: "primary" | "over";
  label: string;
  children?: ReactNode;
}

/** A progress ring that draws itself in on first paint and eases to each new value. */
export function Ring({ value, max, size = 152, stroke = 14, tone = "primary", label, children }: RingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const share = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const [drawn, setDrawn] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(share));
    return () => cancelAnimationFrame(frame);
  }, [share]);

  const center = size / 2;
  return (
    <div className={styles.ring} style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle className={styles.track} cx={center} cy={center} r={radius} strokeWidth={stroke} fill="none" />
        <circle
          className={cx(styles.arc, tone === "over" && styles.over)}
          cx={center}
          cy={center}
          r={radius}
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
