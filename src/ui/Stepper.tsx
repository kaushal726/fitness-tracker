import type { ReactNode } from "react";
import { cx } from "../lib/cx";
import { IconButton } from "./Button";
import { IconMinus, IconPlus } from "./icons";
import styles from "./Stepper.module.css";

interface StepperProps {
  /** What is being set, for a screen reader: "Daily goal", "Breakfast starts at". */
  label: string;
  /** The value as it reads: "2 L", "7:30 AM". */
  value: ReactNode;
  /** A small line under the value. */
  caption?: ReactNode;
  onLess: () => void;
  onMore: () => void;
  lessDisabled?: boolean;
  moreDisabled?: boolean;
  /** Smaller, for a list of them. */
  compact?: boolean;
  className?: string;
}

/** A value with a minus on its left and a plus on its right: for numbers and times that move in steps. */
export function Stepper({ label, value, caption, onLess, onMore, lessDisabled, moreDisabled, compact, className }: StepperProps) {
  return (
    <div className={cx(styles.stepper, compact && styles.compact, className)} role="group" aria-label={label}>
      <IconButton label="Less" icon={<IconMinus />} variant="secondary" disabled={lessDisabled} onClick={onLess} />
      <p className={styles.value} aria-live="polite">
        <span className={cx(styles.main, "num")}>{value}</span>
        {caption && <span className={cx(styles.caption, "num")}>{caption}</span>}
      </p>
      <IconButton label="More" icon={<IconPlus />} variant="secondary" disabled={moreDisabled} onClick={onMore} />
    </div>
  );
}
