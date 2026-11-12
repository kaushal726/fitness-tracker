import type { CSSProperties } from "react";
import { formatVolume, waterShare } from "../../domain/water.ts";
import { useAnimatesIn } from "../../lib/arrival.ts";
import { addDays, parseISODate } from "../../lib/dates.ts";
import { cx } from "../../lib/cx.ts";
import styles from "./WaterWeek.module.css";

const DAYS = 7;
const PERCENT = 100;
/** A day with a little water still shows a bar tall enough to see. */
const MIN_BAR_PERCENT = 8;

interface Props {
  /** The last day shown. */
  until: string;
  /** Millilitres on each day that has any. */
  byDate: ReadonlyMap<string, number>;
  goalMl: number;
}

/** Seven days of water as bars against the goal: a full bar is a day the goal was reached. */
export function WaterWeek({ until, byDate, goalMl }: Props) {
  const animates = useAnimatesIn();
  const days = Array.from({ length: DAYS }, (_, i) => addDays(until, i - (DAYS - 1)));
  return (
    <ol className={styles.week} aria-label="Water on the last seven days">
      {days.map((day, i) => {
        const ml = byDate.get(day) ?? 0;
        const share = waterShare(ml, goalMl);
        const weekday = parseISODate(day).toLocaleDateString("en-IN", { weekday: "long" });
        return (
          <li key={day} className={styles.day} aria-label={`${weekday}: ${formatVolume(ml)}`}>
            <span className={styles.track} aria-hidden>
              {ml > 0 && <span className={cx(styles.bar, share >= 1 && styles.full, animates && "motion-grow-y")} style={{ height: `${Math.max(MIN_BAR_PERCENT, share * PERCENT)}%`, "--i": i } as CSSProperties} />}
            </span>
            <span className={cx(styles.name, day === until && styles.current)} aria-hidden>{weekday.charAt(0)}</span>
          </li>
        );
      })}
    </ol>
  );
}
