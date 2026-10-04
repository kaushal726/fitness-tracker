import { useState } from "react";
import { weekdayAverages } from "../../domain/breakdowns.ts";
import { OVER_DAY_SHARE, type MonthInsights } from "../../domain/monthInsights.ts";
import { formatNumber } from "../../lib/format.ts";
import { ColumnChart, type Column } from "./ColumnChart.tsx";
import { InsightCard } from "./InsightCard.tsx";
import { Readout } from "./Readout.tsx";
import styles from "./WeekdayCard.module.css";

interface Props {
  month: MonthInsights;
}

const NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const INITIALS = ["M", "T", "W", "T", "F", "S", "S"];
const HEADROOM = 1.3;
const CHART_HEIGHT = 112;
/** Fewer than this many days of a weekday is a hint, not a pattern. */
const MIN_PATTERN_DAYS = 2;

/** Which days of the week run heavy: the average calories of each weekday. */
export function WeekdayCard({ month }: Props) {
  const [column, setColumn] = useState<Column | null>(null);
  const week = weekdayAverages(month.days);
  const known = week.filter((w) => w.average !== null);
  const top = known.reduce<(typeof known)[number] | null>((best, w) => (best === null || (w.average ?? 0) > (best.average ?? 0) ? w : best), null);

  const columns: Column[] = week.map((w) => ({
    key: String(w.weekday),
    label: NAMES[w.weekday],
    tick: INITIALS[w.weekday],
    value: w.average,
    tone: w.average !== null && w.average > month.goal * OVER_DAY_SHARE ? "over" : "primary",
    detail: w.average === null ? `${NAMES[w.weekday]}: no logged days` : `${NAMES[w.weekday]}: ${formatNumber(w.average)} kcal on average, over ${w.count} ${w.count === 1 ? "day" : "days"}`,
  }));
  const max = Math.max(month.goal * HEADROOM, ...known.map((w) => w.average ?? 0));

  const readout = column ? (
    <Readout value={column.value ? formatNumber(column.value) : "–"} unit="kcal" caption={column.detail} />
  ) : top && top.count >= MIN_PATTERN_DAYS && top.average !== null ? (
    <Readout value={NAMES[top.weekday]} caption={`Your heaviest day: ${formatNumber(top.average)} kcal on average, ${formatNumber(Math.abs(top.average - month.goal))} ${top.average > month.goal ? "over" : "under"} your goal`} />
  ) : (
    <Readout value="–" caption="A pattern shows once a weekday has been logged a couple of times" />
  );

  return (
    <InsightCard label="By weekday" tag="Average">
      <div className={styles.readout}>{readout}</div>
      <ColumnChart columns={columns} reference={{ value: month.goal, label: "Goal" }} max={max} height={CHART_HEIGHT} title="Average calories for each day of the week" onActive={setColumn} />
    </InsightCard>
  );
}
