import { useId } from "react";
import type { BodyProgress } from "../../domain/bodyProgress.ts";
import { formatKg } from "../../domain/progressNote.ts";
import { daysBetween, formatDate } from "../../lib/dates.ts";
import { useElementWidth } from "../../lib/useElementWidth.ts";
import { linear, niceTicks } from "../insights/chartScale.ts";
import styles from "./WeightPathChart.module.css";

interface Props {
  progress: BodyProgress;
}

const HEIGHT = 190;
const PAD = { top: 14, right: 14, bottom: 26, left: 46 };
const HEADROOM = 0.12;
const MIN_PAD_KG = 0.5;
const TICK_COUNT = 4;
const DOT_R = 5;
/** Date labels closer than this many pixels would run into each other. */
const LABEL_GAP = 64;
const SHORT_DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

/**
 * The estimated weight from the weigh-in to today, and, while the food leads to the target, a dotted line on to the day the
 * target is reached. A dashed line marks the target itself.
 */
export function WeightPathChart({ progress }: Props) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const gradient = `wp${useId().replace(/:/g, "")}`;
  const target = progress.target;
  const first = progress.path[0].date;
  const points = progress.path.map((p) => ({ x: daysBetween(first, p.date), kg: p.kg, date: p.date }));
  const last = points[points.length - 1];
  const ahead = target?.status === "heading" && target.etaDate ? { x: daysBetween(first, target.etaDate), kg: target.kg, date: target.etaDate } : null;

  const kgs = [...points.map((p) => p.kg), ...(target ? [target.kg] : [])];
  const low = Math.min(...kgs);
  const high = Math.max(...kgs);
  const pad = Math.max((high - low) * HEADROOM, MIN_PAD_KG);
  const x = linear(0, Math.max(ahead?.x ?? 0, last.x, 1), PAD.left, Math.max(width - PAD.right, PAD.left + 1));
  const y = linear(high + pad, low - pad, PAD.top, HEIGHT - PAD.bottom);
  const bottom = HEIGHT - PAD.bottom;
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.x).toFixed(1)},${y(p.kg).toFixed(1)}`).join("");
  const labels = [points[0], last, ...(ahead ? [ahead] : [])].filter((p, i, all) => i === 0 || x(p.x) - x(all[i - 1].x) >= LABEL_GAP);

  return (
    <figure className={styles.figure}>
      <div ref={ref} className={styles.chart} style={{ height: HEIGHT }} role="img" aria-label={`Estimated weight from ${formatKg(points[0].kg)} to ${formatKg(last.kg)}${target ? `, target ${formatKg(target.kg)}` : ""}`}>
        {width > 0 && (
          <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} aria-hidden>
            <defs>
              <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" className={styles.stopTop} />
                <stop offset="1" className={styles.stopBottom} />
              </linearGradient>
            </defs>
            {niceTicks(low - pad, high + pad, TICK_COUNT).map((t) => (
              <g key={t}>
                <line className={styles.grid} x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} />
                <text className={styles.tick} x={PAD.left - 8} y={y(t) + 4} textAnchor="end">{t}</text>
              </g>
            ))}
            {labels.map((p) => <text key={p.date} className={styles.tick} x={x(p.x)} y={HEIGHT - 6} textAnchor={p === labels[0] ? "start" : p === labels[labels.length - 1] ? "end" : "middle"}>{formatDate(p.date, SHORT_DATE)}</text>)}

            {target && (
              <>
                <line className={styles.target} x1={PAD.left} x2={width - PAD.right} y1={y(target.kg)} y2={y(target.kg)} />
                <text className={styles.targetText} x={PAD.left + 6} y={y(target.kg) + 16} textAnchor="start">Target {formatKg(target.kg)}</text>
              </>
            )}
            {points.length > 1 && <path className={styles.area} fill={`url(#${gradient})`} d={`${line}L${x(last.x)},${bottom}L${x(0)},${bottom}Z`} />}
            <path className={styles.line} d={line} />
            {ahead && <path className={styles.ahead} d={`M${x(last.x)},${y(last.kg)}L${x(ahead.x)},${y(ahead.kg)}`} />}
            {ahead && <circle className={styles.endMark} cx={x(ahead.x)} cy={y(ahead.kg)} r={DOT_R - 1} />}
            <circle className={styles.dot} cx={x(last.x)} cy={y(last.kg)} r={DOT_R} />
          </svg>
        )}
      </div>
      <div className="visually-hidden">
        <table>
          <caption>Estimated weight on the days that count, in kg</caption>
          <tbody>{points.map((p) => <tr key={p.date}><th scope="row">{formatDate(p.date)}</th><td>{p.kg.toFixed(1)}</td></tr>)}</tbody>
        </table>
      </div>
    </figure>
  );
}
