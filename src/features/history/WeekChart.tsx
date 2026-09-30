import { addDays, parseISODate } from "../../lib/dates.ts";
import { cx } from "../../lib/cx.ts";
import { formatNumber } from "../../lib/format.ts";
import { Card } from "../../ui/Card";
import styles from "./WeekChart.module.css";

const DAYS = 7;
const CHART_HEIGHT = 104;
/** The tallest bar reaches this share above the goal line, so a day over goal still fits. */
const HEADROOM = 1.3;

interface Props {
  today: string;
  goal: number;
  /** Calories eaten per day, by date. Days without an entry count as zero. */
  caloriesByDate: Map<string, number>;
}

/** Seven small bars against the goal line: a glance at the week, nothing more. */
export function WeekChart({ today, goal, caloriesByDate }: Props) {
  const days = Array.from({ length: DAYS }, (_, i) => addDays(today, i - (DAYS - 1)));
  const values = days.map((d) => caloriesByDate.get(d) ?? 0);
  const scaleMax = Math.max(goal * HEADROOM, ...values);
  const loggedDays = values.filter((v) => v > 0);
  const average = loggedDays.length ? loggedDays.reduce((a, b) => a + b, 0) / loggedDays.length : 0;

  return (
    <Card className={styles.card}>
      <div className={styles.head}>
        <div>
          <p className={styles.label}>This week</p>
          <p className={cx(styles.average, "num")}>{formatNumber(average)}<small> kcal a day</small></p>
        </div>
        <p className={styles.goal}>Goal {formatNumber(goal)}</p>
      </div>

      <div className={styles.chart} style={{ height: CHART_HEIGHT }}>
        <span className={styles.goalLine} style={{ bottom: `${(goal / scaleMax) * 100}%` }} aria-hidden />
        {days.map((d, i) => {
          const value = values[i];
          const over = value > goal * 1.05;
          return (
            <div key={d} className={styles.column}>
              <div className={styles.barArea}>
                <div
                  className={cx(styles.bar, over && styles.over, d === today && styles.today)}
                  style={{ height: value > 0 ? `${Math.max(6, (value / scaleMax) * 100)}%` : 0 }}
                  title={`${formatNumber(value)} kcal`}
                />
              </div>
              <span className={cx(styles.day, d === today && styles.dayToday)}>{parseISODate(d).toLocaleDateString("en-IN", { weekday: "narrow" })}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
