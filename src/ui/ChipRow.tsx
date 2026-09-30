import type { ReactNode } from "react";
import styles from "./ChipRow.module.css";

interface Props {
  /** What the row is for, for a screen reader. */
  label: string;
  children: ReactNode;
  className?: string;
}

/** Chips on one line that scrolls sideways past the gutter, at every screen size: a wide screen does not turn it into a block. */
export function ChipRow({ label, children, className }: Props) {
  return <div className={className ? `${styles.row} ${className}` : styles.row} role="group" aria-label={label}>{children}</div>;
}
