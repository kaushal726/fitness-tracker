import { useState } from "react";
import { isCounted, OVER_DAY_SHARE, type DayStat, type MonthInsights } from "../../domain/monthInsights.ts";
import { parseISODate } from "../../lib/dates.ts";
import { formatNumber } from "../../lib/format.ts";
import { ColumnChart, type Column } from "./ColumnChart.tsx";
import { InsightCard } from "./InsightCard.tsx";
import { Legend } from "./Legend.tsx";
import { Readout } from "./Readout.tsx";

interface Props {
  month: MonthInsights;
}

const HEADROOM = 1.3;
const CHART_HEIGHT = 132;

function describe(d: DayStat, goal: number): string {
  const date = parseISODate(d.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const kcal = Math.round(d.totals.calories);
  if (!d.logged) return `${date}: nothing logged`;
  if (d.phase === "today") return `${date}, today so far`;
  if (d.partial) return `${date}: looks half-logged, so it is left out of the balance`;
  const diff = kcal - Math.round(goal);
  return `${date}: ${diff === 0 ? "exactly your goal" : `${formatNumber(Math.abs(diff))} kcal ${diff > 0 ? "over" : "under"} your goal`}`;
}

function toColumn(d: DayStat, goal: number): Column {
  const over = isCounted(d) && d.totals.calories > goal * OVER_DAY_SHARE;
  return {
    key: d.date,
    label: parseISODate(d.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
    tick: d.day === 1 || d.day % 5 === 0 ? String(d.day) : "",
    value: d.logged ? d.totals.calories : null,
    tone: d.phase === "today" ? "soft" : d.partial ? "muted" : over ? "over" : "primary",
    current: d.phase === "today",
    detail: `${describe(d, goal)}${d.logged ? `: ${formatNumber(d.totals.calories)} kcal` : ""}`,
  };
}

/** Every day of the month as a column against the goal: the heavy days and the light ones. */
export function DailyCard({ month }: Props) {
  const [column, setColumn] = useState<Column | null>(null);
  const columns = month.days.map((d) => toColumn(d, month.goal));
  const max = Math.max(month.goal * HEADROOM, ...month.days.map((d) => d.totals.calories));

  const readout = column ? (
    <Readout value={column.value ? formatNumber(column.value) : "–"} unit="kcal" caption={column.label} />
  ) : month.average ? (
    <Readout value={formatNumber(month.average.calories)} unit="kcal a day" caption={`Average over ${month.countedDays} ${month.countedDays === 1 ? "day" : "days"}${month.overDays > 0 ? ` · ${month.overDays} over your goal` : ""}`} />
  ) : (
    <Readout value="–" unit="kcal a day" caption="Shows once a full day is logged" />
  );

  return (
    <InsightCard label="Day by day" tag={`Goal ${formatNumber(month.goal)}`}>
      {readout}
      <ColumnChart columns={columns} reference={{ value: month.goal, label: "Goal" }} max={max} height={CHART_HEIGHT} title="Calories eaten each day of the month, against your goal" onActive={setColumn} />
      <Legend items={[{ label: "Within goal", swatch: "box", tone: "primary" }, { label: "Over", swatch: "box", tone: "over" }, { label: "Today", swatch: "box", tone: "soft" }, { label: "Half-logged", swatch: "box", tone: "muted" }]} />
    </InsightCard>
  );
}
