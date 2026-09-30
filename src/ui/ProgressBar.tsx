import { cx } from "../lib/cx";
import styles from "./ProgressBar.module.css";

export type BarTone = "primary" | "protein" | "carbs" | "fat" | "fiber" | "over";

interface ProgressBarProps {
  value: number;
  max: number;
  tone?: BarTone;
  label: string;
  size?: "md" | "sm";
}

/** Fill is capped at 100% visually; the numbers beside it carry any overshoot. */
export function ProgressBar({ value, max, tone = "primary", label, size = "md" }: ProgressBarProps) {
  const share = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <div className={cx(styles.track, size === "sm" && styles.small)} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={Math.round(max)} aria-valuenow={Math.round(value)}>
      <div className={cx(styles.fill, styles[tone])} style={{ width: `${share * 100}%` }} />
    </div>
  );
}
