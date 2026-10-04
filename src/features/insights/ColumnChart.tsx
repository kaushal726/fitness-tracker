import { useId, useState, type KeyboardEvent, type PointerEvent } from "react";
import { cx } from "../../lib/cx.ts";
import { slotAt } from "./chartScale.ts";
import styles from "./ColumnChart.module.css";

export type ColumnTone = "primary" | "over" | "muted" | "soft";

export interface Column {
  key: string;
  /** What the column is called, for the table a screen reader gets. */
  label: string;
  /** What is printed under it: usually only a few columns carry one. */
  tick: string;
  /** Null draws no column: nothing to show for this slot. */
  value: number | null;
  tone: ColumnTone;
  /** The slot that is "now": drawn with a ring and a bold label. */
  current?: boolean;
  /** What the readout says while this column is pointed at. */
  detail: string;
}

interface Props {
  columns: Column[];
  /** The line to measure against, and the label on it. */
  reference: { value: number; label: string };
  /** The top of the scale. */
  max: number;
  /** The plot area's height in pixels, not counting the labels. */
  height: number;
  /** For a screen reader: what the chart is. The data itself follows as a table. */
  title: string;
  /** Receives the column pointed at, or null when the pointer leaves. */
  onActive: (column: Column | null) => void;
}

/**
 * Columns against a goal line. Thin, rounded at the top, square on the baseline. The whole chart is the hit target:
 * a finger or a pointer anywhere over it picks the nearest column, and the arrow keys walk along them.
 */
export function ColumnChart({ columns, reference, max, height, title, onActive }: Props) {
  const tableId = useId();
  const [active, setActive] = useState<number | null>(null);

  const select = (index: number | null) => {
    setActive(index);
    onActive(index === null ? null : (columns[index] ?? null));
  };
  const pointer = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    select(slotAt(e.clientX - box.left, box.width, columns.length));
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const step = e.key === "ArrowRight" ? 1 : -1;
    select(Math.min(columns.length - 1, Math.max(0, (active ?? (step > 0 ? -1 : columns.length)) + step)));
  };

  return (
    <figure className={styles.figure}>
      <div
        className={styles.chart}
        style={{ height }}
        tabIndex={0}
        role="group"
        aria-label={`${title}. Use the arrow keys to move along it.`}
        aria-describedby={tableId}
        onPointerDown={pointer}
        onPointerMove={pointer}
        onPointerLeave={(e) => e.pointerType === "mouse" && select(null)}
        onKeyDown={key}
        onBlur={() => select(null)}
      >
        <span className={styles.line} style={{ bottom: `${(reference.value / max) * 100}%` }} aria-hidden>
          <span className={styles.lineLabel}>{reference.label}</span>
        </span>
        <div className={styles.columns} style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
          {columns.map((c, i) => (
            <div key={c.key} className={cx(styles.slot, active === i && styles.active)}>
              {c.value !== null && c.value > 0 ? (
                <span className={cx(styles.bar, styles[c.tone], c.current && styles.current)} style={{ height: `${Math.max(2, Math.min(1, c.value / max) * 100)}%` }} />
              ) : (
                <span className={styles.empty} />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.labels} style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }} aria-hidden>
        {columns.map((c) => <span key={c.key} className={cx(styles.label, c.current && styles.labelCurrent)}>{c.tick}</span>)}
      </div>
      <div className="visually-hidden">
        <table id={tableId}>
          <caption>{title}</caption>
          <tbody>
            {columns.map((c) => <tr key={c.key}><th scope="row">{c.label}</th><td>{c.detail}</td></tr>)}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
