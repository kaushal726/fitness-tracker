import { useEffect, useId, useState, type CSSProperties, type ReactNode } from "react";
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
  /** How much of a circle it is, in degrees. Less than a full turn makes a gauge, open at the bottom. */
  sweep?: number;
  /** A glowing dot that rides the end of the arc and breathes: for the big ring that leads a screen. */
  knob?: boolean;
  /** A glint of light that runs along the arc now and then. */
  shine?: boolean;
  /** Lets a place restyle the ring's colours (`--ring-from`, `--ring-to`, `--ring-track`). */
  className?: string;
  children?: ReactNode;
}

/** A progress ring that draws itself in when it appears (already drawn when the app starts) and eases to each new value. */
const FULL_TURN = 360;
/** Where a full ring starts: the top. */
const TOP = -90;
/** Where the middle of a gauge's opening points: straight down. */
const BOTTOM = 90;
/** How long the running glint is, against the stroke. */
const SHINE_PER_STROKE = 2.2;

export function Ring({ value, max, size = 152, stroke = 14, tone = "primary", label, glow = false, sweep = FULL_TURN, knob = false, shine = false, className, children }: RingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const length = circumference * (Math.min(FULL_TURN, sweep) / FULL_TURN);
  const startAngle = sweep >= FULL_TURN ? TOP : BOTTOM + (FULL_TURN - sweep) / 2;
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
  const drawnLength = length * drawn;
  const shineLength = stroke * SHINE_PER_STROKE;
  const tipAngle = startAngle + Math.min(FULL_TURN, sweep) * drawn;
  const shineStyle = { "--shine-from": `${shineLength}`, "--shine-to": `${shineLength - drawnLength}` } as CSSProperties;
  return (
    <div className={cx(styles.ring, styles[tone], glow && styles.glow, className)} style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" className={styles.from} />
            <stop offset="1" className={styles.to} />
          </linearGradient>
        </defs>
        <circle className={styles.track} cx={center} cy={center} r={radius} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${length} ${circumference}`} transform={`rotate(${startAngle} ${center} ${center})`} />
        <circle
          className={styles.arc}
          cx={center}
          cy={center}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${length} ${circumference}`}
          strokeDashoffset={length * (1 - drawn)}
          transform={`rotate(${startAngle} ${center} ${center})`}
          style={{ opacity: drawn > 0 ? 1 : 0 }}
        />
        {shine && drawnLength > shineLength * 2 && (
          <circle
            key={Math.round(drawnLength)}
            className={styles.shine}
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={stroke * 0.55}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${shineLength} ${circumference * 2}`}
            transform={`rotate(${startAngle} ${center} ${center})`}
            style={shineStyle}
          />
        )}
        {knob && (
          <g className={styles.knob} style={{ transform: `rotate(${tipAngle}deg)`, transformOrigin: `${center}px ${center}px`, opacity: drawn > 0 ? 1 : 0 }}>
            <circle className={styles.knobHalo} cx={center + radius} cy={center} r={stroke * 0.5} />
            <circle className={styles.knobDot} cx={center + radius} cy={center} r={stroke * 0.32} />
          </g>
        )}
      </svg>
      <div className={styles.center}>{children}</div>
    </div>
  );
}
