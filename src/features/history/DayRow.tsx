import { formatDayLabel, parseISODate } from "../../lib/dates.ts";
import { cx } from "../../lib/cx.ts";
import { formatNumber } from "../../lib/format.ts";
import type { NutritionTotals } from "../../nutrition/types.ts";
import { IconChevronRight } from "../../ui/icons";
import { ProgressBar } from "../../ui/ProgressBar";
import styles from "./DayRow.module.css";

const OVER_TOLERANCE = 1.05;

interface Props {
  date: string;
  totals: NutritionTotals;
  goal: number;
  onOpen: (date: string) => void;
}

/** One logged day: when, how much, and how that sits against the goal. */
export function DayRow({ date, totals, goal, onOpen }: Props) {
  const d = parseISODate(date);
  const over = totals.calories > goal * OVER_TOLERANCE;
  const share = goal > 0 ? Math.round((totals.calories / goal) * 100) : 0;
  return (
    <button type="button" className={styles.row} onClick={() => onOpen(date)}>
      <span className={styles.date} aria-hidden>
        <span className={styles.weekday}>{d.toLocaleDateString("en-IN", { weekday: "short" })}</span>
        <span className={styles.number}>{d.getDate()}</span>
      </span>
      <span className={styles.main}>
        <span className={styles.top}>
          <span className={styles.title}>{formatDayLabel(date)}</span>
          <span className={cx(styles.kcal, "num", over && styles.overText)}>{formatNumber(totals.calories)}<small> kcal</small></span>
        </span>
        <ProgressBar value={totals.calories} max={goal} tone={over ? "over" : "primary"} size="sm" label={`${share}% of goal`} />
        <span className={cx(styles.macros, "num")}>
          Protein {formatNumber(totals.protein)} g · Carbs {formatNumber(totals.carbs)} g · Fat {formatNumber(totals.fat)} g
        </span>
      </span>
      <IconChevronRight className={styles.chevron} aria-hidden />
    </button>
  );
}
