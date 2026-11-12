import type { CSSProperties } from "react";
import { cx } from "../../lib/cx.ts";
import styles from "./GaugeTicks.module.css";

interface Props {
  /** The diameter of the ring the ticks sit around. */
  ringSize: number;
  /** How far outside the ring the ticks reach. */
  reach: number;
  /** Degrees of the gauge, open at the bottom. */
  sweep: number;
  /** How much of the gauge is filled, 0 to 1. */
  share: number;
  count?: number;
}

const FULL_TURN = 360;
/** Where the gauge's opening points: straight down. */
const BOTTOM = 90;
const GAP = 7;
const LONG_EVERY = 5;

/**
 * A speedometer's ticks around the gauge. The ones up to the day's share light up one after another, so a meal added
 * sweeps a wave of light along the dial.
 */
export function GaugeTicks({ ringSize, reach, sweep, share, count = 41 }: Props) {
  const size = ringSize + reach * 2;
  const center = size / 2;
  const outer = center - 1;
  const start = BOTTOM + (FULL_TURN - sweep) / 2;
  const lit = Math.round(Math.min(1, Math.max(0, share)) * (count - 1));
  return (
    <svg className={styles.ticks} width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ margin: -reach }} aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const angle = start + (sweep * i) / (count - 1);
        const long = i % LONG_EVERY === 0;
        const inner = outer - (long ? reach - GAP + 2 : reach - GAP - 3);
        return (
          <line
            key={i}
            className={cx(styles.tick, long && styles.long, share > 0 && i <= lit && styles.lit)}
            x1={center + inner}
            y1={center}
            x2={center + outer - 2}
            y2={center}
            transform={`rotate(${angle} ${center} ${center})`}
            style={{ "--i": i } as CSSProperties}
          />
        );
      })}
    </svg>
  );
}
