import type { ReactNode } from "react";
import styles from "./Donut.module.css";

export interface DonutSlice {
  key: string;
  /** Its share of the whole, 0 to 1. */
  share: number;
  /** A CSS colour, normally a token. */
  color: string;
}

interface Props {
  slices: DonutSlice[];
  /** For a screen reader. */
  label: string;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}

/** The surface-coloured gap between neighbouring slices, in pixels of arc. */
const GAP = 2;

/** A ring cut into its parts, with room in the middle for the one number that sums it up. */
export function Donut({ slices, label, size = 128, stroke = 16, children }: Props) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  let start = 0;
  return (
    <div className={styles.donut} style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle className={styles.track} cx={center} cy={center} r={radius} strokeWidth={stroke} fill="none" />
        {slices.map((s) => {
          const length = Math.max(0, s.share * circumference - (slices.length > 1 ? GAP : 0));
          const arc = (
            <circle
              key={s.key}
              cx={center}
              cy={center}
              r={radius}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-start}
              transform={`rotate(-90 ${center} ${center})`}
              style={{ stroke: s.color }}
            />
          );
          start += s.share * circumference;
          return arc;
        })}
      </svg>
      <div className={styles.center}>{children}</div>
    </div>
  );
}
