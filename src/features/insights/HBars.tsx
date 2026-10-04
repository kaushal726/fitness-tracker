import { formatNumber } from "../../lib/format.ts";
import styles from "./HBars.module.css";

export interface HBar {
  key: string;
  label: string;
  /** The bar's length. */
  value: number;
  /** At the end of the label's line. */
  text: string;
  /** Small, after the label. */
  hint?: string;
}

interface Props {
  rows: HBar[];
  title: string;
}

/**
 * Horizontal bars for a few named things. The name and its amount share a line so a long name is never cut off, and the
 * bar under them is as long as the amount. One hue: the order of the rows is not a scale.
 */
export function HBars({ rows, title }: Props) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className={styles.list} aria-label={title}>
      {rows.map((r) => (
        <li key={r.key} className={styles.row}>
          <div className={styles.line}>
            <span className={styles.name}>{r.label}</span>
            {r.hint && <span className={styles.hint}>{r.hint}</span>}
            <span className={styles.text}>{r.text}</span>
          </div>
          <span className={styles.track} aria-hidden>
            <span className={styles.bar} style={{ width: `${Math.max(1.5, (r.value / max) * 100)}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export const kcalText = (value: number): string => `${formatNumber(value)} kcal`;
