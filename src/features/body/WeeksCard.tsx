import { useState } from "react";
import { formatDate } from "../../lib/dates.ts";
import { ColumnChart, type Column } from "../insights/ColumnChart.tsx";
import { InsightCard } from "../insights/InsightCard.tsx";
import { Readout } from "../insights/Readout.tsx";
import type { BodyView } from "./useBodyProgress.ts";
import styles from "./WeeksCard.module.css";

const CHART_HEIGHT = 112;
const HEADROOM = 1.4;
const MIN_SCALE_KG = 0.5;
/** For a goal of staying put: a week inside this is level. */
const STEADY_WEEK_KG = 0.25;
const SHORT_DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

const signedKg = (kg: number): string => {
  const rounded = Math.round(kg * 100) / 100;
  return rounded > 0 ? `+${rounded}` : rounded < 0 ? `−${Math.abs(rounded)}` : "0";
};

/** Week by week: how far the estimated weight moved, green when it went the way the goal asks. */
export function WeeksCard({ view }: { view: BodyView }) {
  const { plan, goal, progress: p } = view;
  const [column, setColumn] = useState<Column | null>(null);
  const planKg = Math.abs(plan.weeklyChangeKg) || STEADY_WEEK_KG;
  const toward = (kg: number): boolean => (goal.direction < 0 ? kg < 0 : goal.direction > 0 ? kg > 0 : Math.abs(kg) <= STEADY_WEEK_KG);

  const columns: Column[] = p.weeks.map((w, i) => ({
    key: w.start,
    label: `Week of ${formatDate(w.start, SHORT_DATE)}`,
    tick: formatDate(w.start, SHORT_DATE),
    value: w.days === 0 ? null : Math.abs(w.kg),
    tone: toward(w.kg) ? "primary" : "over",
    current: i === p.weeks.length - 1,
    detail: w.days === 0 ? `Week of ${formatDate(w.start, SHORT_DATE)}: no logged days` : `Week of ${formatDate(w.start, SHORT_DATE)}: ${signedKg(w.kg)} kg, from ${w.days} logged ${w.days === 1 ? "day" : "days"}`,
  }));
  const latest = [...p.weeks].reverse().find((w) => w.days > 0);
  const max = Math.max(planKg * HEADROOM, MIN_SCALE_KG, ...p.weeks.map((w) => Math.abs(w.kg)));

  const readout = column ? (
    <Readout value={column.value === null ? "–" : signedKg(p.weeks.find((w) => w.start === column.key)?.kg ?? 0)} unit="kg" caption={column.detail} />
  ) : latest ? (
    <Readout value={signedKg(latest.kg)} unit="kg" caption={`Latest week with food logged, from ${latest.days} ${latest.days === 1 ? "day" : "days"}`} />
  ) : (
    <Readout value={"–"} caption="Weeks show once a day is logged" />
  );

  return (
    <InsightCard label="Week by week" tag="Estimated">
      <div className={styles.readout}>{readout}</div>
      <ColumnChart columns={columns} reference={{ value: planKg, label: "Plan" }} max={max} height={CHART_HEIGHT} title="Estimated weight change in each week" onActive={setColumn} />
    </InsightCard>
  );
}
