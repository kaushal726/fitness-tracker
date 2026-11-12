import { useMemo, useState } from "react";
import { useAppState } from "../../data/store.ts";
import type { MonthInsights } from "../../domain/monthInsights.ts";
import { formatVolume, glassesOf, waterByDate, waterSummary } from "../../domain/water.ts";
import { parseISODate } from "../../lib/dates.ts";
import { glassCount } from "../water/glassCount.ts";
import { ColumnChart, type Column } from "./ColumnChart.tsx";
import { InsightCard } from "./InsightCard.tsx";
import { Readout } from "./Readout.tsx";

interface Props {
  month: MonthInsights;
}

const HEADROOM = 1.3;
const CHART_HEIGHT = 112;
const TICK_EVERY = 5;

/** "1.6 L" as the figure and its unit, so the unit can be set small beside it. */
function volumeParts(ml: number): { amount: string; unit: string } {
  const [amount, unit] = formatVolume(ml).split(" ");
  return { amount, unit };
}

/** Water on every day of the month against the goal: how much on an average day, and on how many days the goal was reached. */
export function WaterMonthCard({ month }: Props) {
  const { water, entries, settings } = useAppState();
  const [column, setColumn] = useState<Column | null>(null);
  const byDate = useMemo(() => waterByDate(water, entries), [water, entries]);
  const { waterGoalMl: goalMl, waterGlassMl: glassMl } = settings;
  const summary = waterSummary(month.days.map((d) => d.date), byDate, goalMl);

  const columns: Column[] = month.days.map((d) => {
    const ml = byDate.get(d.date) ?? 0;
    const date = parseISODate(d.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
    return {
      key: d.date,
      label: date,
      tick: d.day === 1 || d.day % TICK_EVERY === 0 ? String(d.day) : "",
      value: ml > 0 ? ml : null,
      tone: ml >= goalMl ? "water" : "waterSoft",
      current: d.phase === "today",
      detail: ml > 0 ? `${date}: ${formatVolume(ml)}, ${glassCount(glassesOf(ml, glassMl))}` : `${date}: no water added`,
    };
  });
  const max = Math.max(goalMl * HEADROOM, ...month.days.map((d) => byDate.get(d.date) ?? 0));

  const average = volumeParts(summary.averageMl);
  const pointed = column?.value ? volumeParts(column.value) : null;
  const readout = column ? (
    <Readout value={pointed?.amount ?? "–"} unit={pointed?.unit} caption={column.detail} />
  ) : summary.days > 0 ? (
    <Readout value={average.amount} unit={`${average.unit} a day`} caption={`About ${glassCount(glassesOf(summary.averageMl, glassMl))} · goal reached on ${summary.daysReached} of ${summary.days} ${summary.days === 1 ? "day" : "days"}`} />
  ) : (
    <Readout value="–" unit="L a day" caption="Add water on Today and the month shows here" />
  );

  return (
    <InsightCard label="Water" tag={`Goal ${formatVolume(goalMl)}`}>
      {readout}
      <ColumnChart columns={columns} reference={{ value: goalMl, label: "Goal" }} max={max} height={CHART_HEIGHT} title="Water on each day of the month, against your goal" onActive={setColumn} />
    </InsightCard>
  );
}
