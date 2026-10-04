import { cx } from "../../lib/cx.ts";
import styles from "./Legend.module.css";

export interface LegendItem {
  label: string;
  /** What the key looks like: a box for bars and fills, a stroke for a line. */
  swatch: "box" | "line" | "dots";
  tone: "primary" | "over" | "muted" | "soft" | "ink";
}

/** The key under a chart. Shapes mirror the marks; the words are in ink, never in the series colour. */
export function Legend({ items }: { items: LegendItem[] }) {
  return (
    <ul className={styles.legend}>
      {items.map((item) => (
        <li key={item.label} className={styles.item}>
          <span className={cx(styles.swatch, styles[item.swatch], styles[item.tone])} aria-hidden />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
