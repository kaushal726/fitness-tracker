import { useState } from "react";
import type { Entry } from "../../data/types.ts";
import { eatingClock, LATE_NIGHT_BLOCK, mealHabits } from "../../domain/habits.ts";
import { MEAL_LABELS } from "../../domain/meals.ts";
import type { MonthInsights } from "../../domain/monthInsights.ts";
import { ColumnChart, type Column } from "./ColumnChart.tsx";
import { HBars } from "./HBars.tsx";
import { InsightCard } from "./InsightCard.tsx";
import { Readout } from "./Readout.tsx";
import styles from "./ClockCard.module.css";

interface Props {
  month: MonthInsights;
  entries: Entry[];
}

const CHART_HEIGHT = 104;
const SHARE_HEADROOM = 1.25;

/** When the food is logged through the day, how much of it comes late at night, and which meals are skipped. */
export function ClockCard({ month, entries }: Props) {
  const [column, setColumn] = useState<Column | null>(null);
  const blocks = eatingClock(entries, month.days);
  const habits = mealHabits(entries, month.days);
  const counted = habits[0]?.countedDays ?? 0;
  const top = blocks.reduce((best, b) => (b.share > best.share ? b : best), blocks[0]);
  const night = blocks.find((b) => b.id === LATE_NIGHT_BLOCK);

  const columns: Column[] = blocks.map((b) => ({
    key: b.id,
    label: b.label,
    tick: b.tick,
    value: b.share * 100,
    tone: b.id === LATE_NIGHT_BLOCK ? "over" : "primary",
    detail: `${b.label}: ${Math.round(b.share * 100)}% of your calories`,
  }));
  const max = Math.max(top?.share * 100 * SHARE_HEADROOM || 0, 25);

  const readout = column ? (
    <Readout value={`${Math.round(column.value ?? 0)}%`} caption={column.detail} />
  ) : top && top.share > 0 ? (
    <Readout value={top.label} caption={`Most of your calories: ${Math.round(top.share * 100)}%${night && night.share > 0 ? `. After 9 pm: ${Math.round(night.share * 100)}%` : ""}`} />
  ) : (
    <Readout value={"–"} caption="Shows once a full day is logged" />
  );

  return (
    <InsightCard label="When you eat" tag="By time logged">
      <div className={styles.readout}>{readout}</div>
      {top && top.share > 0 && <ColumnChart columns={columns} reference={{ value: 100 / blocks.length, label: "Even" }} max={max} height={CHART_HEIGHT} title="Share of calories by time of day" onActive={setColumn} />}
      {counted > 0 && (
        <>
          <h3 className={styles.sub}>Meals logged</h3>
          <HBars
            title="Days each meal was logged"
            rows={habits.map((h) => ({ key: h.meal, label: MEAL_LABELS[h.meal], value: h.days, text: `${h.days} of ${h.countedDays} ${h.countedDays === 1 ? "day" : "days"}`, hint: h.days < h.countedDays ? `skipped ${h.countedDays - h.days}` : undefined }))}
          />
        </>
      )}
    </InsightCard>
  );
}
