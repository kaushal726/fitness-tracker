import { useId, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { BalancePoint, MonthInsights } from "../../domain/monthInsights.ts";
import { useElementWidth } from "../../lib/useElementWidth.ts";
import { linear, niceCeil, signed } from "./chartScale.ts";
import styles from "./BalanceChart.module.css";

export interface BalanceReading extends BalancePoint {
  /** True for a day still to come: where the balance would go, not where it has been. */
  projected: boolean;
}

interface Props {
  month: MonthInsights;
  onActive: (reading: BalanceReading | null) => void;
}

const HEIGHT = 200;
const PAD = { top: 10, right: 10, bottom: 26, left: 48 };
const X_TICKS = [1, 8, 15, 22, 29];
const HEADROOM = 1.1;
const MIN_SPAN_KCAL = 200;
/** The shorter side of the zero line is at least this share of the longer one. */
const MIN_SIDE_SHARE = 0.25;
const DOT_R = 5;

const pathOf = (points: BalancePoint[], x: (d: number) => number, y: (b: number) => number): string =>
  points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.day).toFixed(1)},${y(p.balance).toFixed(1)}`).join("");

/**
 * The month's balance against its goal, day by day: above the zero line is calories under the goal, below it is calories
 * over. The solid line is what happened; the dotted one is where it goes if the rest of the month follows the suggestion.
 */
export function BalanceChart({ month, onActive }: Props) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const gradientId = `bal${useId().replace(/:/g, "")}`;
  const [active, setActive] = useState<number | null>(null);

  const actual: BalancePoint[] = [{ day: 0, balance: 0 }, ...month.series];
  const ahead = month.rebalance?.projection ?? [];
  const points: BalanceReading[] = [...actual.map((p) => ({ ...p, projected: false })), ...ahead.slice(1).map((p) => ({ ...p, projected: true }))];
  // Each side of the zero line is as tall as the month needs it, so a month that is all over its goal is not drawn half empty.
  const balances = points.map((p) => p.balance);
  const reach = Math.max(MIN_SPAN_KCAL, ...balances.map(Math.abs));
  const up = niceCeil(Math.max(Math.max(...balances, 0) * HEADROOM, reach * MIN_SIDE_SHARE));
  const down = niceCeil(Math.max(Math.max(...balances.map((b) => -b), 0) * HEADROOM, reach * MIN_SIDE_SHARE));

  const x = linear(0, month.days.length, PAD.left, Math.max(width - PAD.right, PAD.left + 1));
  const y = linear(up, -down, PAD.top, HEIGHT - PAD.bottom);
  const zero = y(0);
  const now = actual[actual.length - 1] ?? actual[0];
  const shown = active === null ? null : (points[active] ?? null);

  const select = (index: number | null) => {
    setActive(index);
    onActive(index === null ? null : (points[index] ?? null));
  };
  const pointer = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const day = linear(PAD.left, Math.max(width - PAD.right, PAD.left + 1), 0, month.days.length)(e.clientX - box.left);
    let best = 0;
    points.forEach((p, i) => {
      if (Math.abs(p.day - day) < Math.abs((points[best]?.day ?? 0) - day)) best = i;
    });
    select(best);
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const step = e.key === "ArrowRight" ? 1 : -1;
    select(Math.min(points.length - 1, Math.max(0, (active ?? actual.length - 1) + step)));
  };

  const tone = (balance: number) => (balance >= 0 ? styles.under : styles.over);
  const ticks = [up, 0, -down];
  const plotRight = width - PAD.right;

  return (
    <figure className={styles.figure}>
      <div
        ref={ref}
        className={styles.chart}
        style={{ height: HEIGHT }}
        tabIndex={0}
        role="group"
        aria-label="Balance against your goal through the month. Use the arrow keys to move along it."
        onPointerDown={pointer}
        onPointerMove={pointer}
        onPointerLeave={(e) => e.pointerType === "mouse" && select(null)}
        onKeyDown={key}
        onBlur={() => select(null)}
      >
        {width > 0 && (
          <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} aria-hidden>
            <defs>
              <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1={PAD.top} x2="0" y2={HEIGHT - PAD.bottom}>
                <stop offset={up / (up + down)} className={styles.stopUnder} />
                <stop offset={up / (up + down)} className={styles.stopOver} />
              </linearGradient>
              <clipPath id={`${gradientId}a`}><rect x="0" y={PAD.top} width={width} height={zero - PAD.top} /></clipPath>
              <clipPath id={`${gradientId}b`}><rect x="0" y={zero} width={width} height={HEIGHT - PAD.bottom - zero} /></clipPath>
            </defs>

            {[up, -down].map((t) => <line key={t} className={styles.grid} x1={PAD.left} x2={plotRight} y1={y(t)} y2={y(t)} />)}
            <line className={styles.zero} x1={PAD.left} x2={plotRight} y1={zero} y2={zero} />
            {ticks.map((t) => <text key={t} className={styles.tick} x={PAD.left - 8} y={y(t) + 4} textAnchor="end">{signed(t)}</text>)}
            {X_TICKS.filter((d) => d <= month.days.length).map((d) => <text key={d} className={styles.tick} x={x(d)} y={HEIGHT - 6} textAnchor="middle">{d}</text>)}

            {actual.length > 1 && (
              <>
                <path className={styles.areaUnder} clipPath={`url(#${gradientId}a)`} d={`${pathOf(actual, x, y)}L${x(now.day)},${zero}L${x(0)},${zero}Z`} />
                <path className={styles.areaOver} clipPath={`url(#${gradientId}b)`} d={`${pathOf(actual, x, y)}L${x(now.day)},${zero}L${x(0)},${zero}Z`} />
                <path className={styles.line} stroke={`url(#${gradientId})`} d={pathOf(actual, x, y)} />
              </>
            )}
            {ahead.length > 1 && <path className={styles.ahead} d={pathOf(ahead, x, y)} />}
            {ahead.length > 1 && <circle className={styles.endMark} cx={x(ahead[ahead.length - 1].day)} cy={y(ahead[ahead.length - 1].balance)} r={DOT_R - 1} />}

            {shown && <line className={styles.cursor} x1={x(shown.day)} x2={x(shown.day)} y1={PAD.top} y2={HEIGHT - PAD.bottom} />}
            {actual.length > 1 && <circle className={`${styles.dot} ${tone(now.balance)}`} cx={x(now.day)} cy={y(now.balance)} r={DOT_R} />}
            {shown && <circle className={`${styles.dot} ${tone(shown.balance)}`} cx={x(shown.day)} cy={y(shown.balance)} r={DOT_R} />}
          </svg>
        )}
      </div>
      <div className="visually-hidden">
        <table>
          <caption>Balance against the goal at the end of each day, in kcal. Positive is under the goal.</caption>
          <tbody>{points.slice(1).map((p) => <tr key={p.day}><th scope="row">Day {p.day}{p.projected ? " (if the suggestion is followed)" : ""}</th><td>{signed(p.balance)}</td></tr>)}</tbody>
        </table>
      </div>
    </figure>
  );
}
