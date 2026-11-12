import type { WeightPoint } from "../../domain/weighIns.ts";
import { formatKg } from "../../domain/progressNote.ts";
import { formatDate } from "../../lib/dates.ts";
import styles from "./WeighInChart.module.css";

interface Props {
  /** Oldest first. */
  points: WeightPoint[];
  /** Drawn as a dashed line when given. */
  targetKg: number | null;
}

const W = 320;
const H = 150;
const PAD = { top: 18, right: 54, bottom: 24, left: 8 };
/** The scale never zooms in past this many kilograms, so the wobble of the scale does not look like a cliff. */
const MIN_SPAN_KG = 2;
const LABEL_GAP = 14;
const SHORT: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

/** The weigh-ins as a line, oldest on the left, with the target as a dashed line when there is one. */
export function WeighInChart({ points, targetKg }: Props) {
  const values = points.map((p) => p.kg).concat(targetKg === null ? [] : [targetKg]);
  const mid = (Math.max(...values) + Math.min(...values)) / 2;
  const span = Math.max(MIN_SPAN_KG, Math.max(...values) - Math.min(...values));
  const low = mid - span / 2;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (kg: number) => PAD.top + plotH - ((kg - low) / span) * plotH;
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.kg).toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  // Both labels sit at the right edge: the target's gives way when it would sit on the latest weight's.
  const targetLabelFits = targetKg !== null && Math.abs(y(targetKg) - y(last.kg)) >= LABEL_GAP;

  return (
    <figure className={styles.chart}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Weigh-ins from ${formatKg(points[0].kg)} to ${formatKg(last.kg)}`}>
        {targetKg !== null && (
          <g className={styles.target}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(targetKg)} y2={y(targetKg)} />
            {targetLabelFits && <text x={W - PAD.right + 6} y={y(targetKg) + 4}>{formatKg(targetKg)}</text>}
          </g>
        )}
        {points.length > 1 && <path className={styles.line} d={path} />}
        {points.map((p, i) => (
          <circle key={p.date} className={styles.dot} cx={x(i)} cy={y(p.kg)} r={i === points.length - 1 ? 5.5 : 4}>
            <title>{`${formatDate(p.date, SHORT)}: ${formatKg(p.kg)}`}</title>
          </circle>
        ))}
        <text className={styles.lastLabel} x={x(points.length - 1) + 10} y={y(last.kg) + 4}>{formatKg(last.kg)}</text>
        <text className={styles.axis} x={PAD.left} y={H - 4}>{formatDate(points[0].date, SHORT)}</text>
        {points.length > 1 && <text className={styles.axis} x={x(points.length - 1)} y={H - 4} textAnchor="end">{formatDate(last.date, SHORT)}</text>}
      </svg>
    </figure>
  );
}
