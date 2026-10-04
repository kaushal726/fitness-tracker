import type { ReactNode } from "react";
import { cx } from "../../lib/cx.ts";
import styles from "./Readout.module.css";

interface Props {
  /** The big figure. */
  value: ReactNode;
  /** Small text after it ("kcal a day"). */
  unit?: string;
  /** What the figure is about; changes with what the pointer is on. */
  caption?: ReactNode;
}

/** The line above a chart that says what it shows, and says it about whatever is pointed at. */
export function Readout({ value, unit, caption }: Props) {
  return (
    <div className={styles.readout} aria-live="polite">
      <p className={cx(styles.value, "num")}>{value}{unit && <small> {unit}</small>}</p>
      {caption && <p className={styles.caption}>{caption}</p>}
    </div>
  );
}
