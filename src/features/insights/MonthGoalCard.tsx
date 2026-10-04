import { useState } from "react";
import { balanceNote } from "../../domain/balanceNote.ts";
import type { MonthInsights } from "../../domain/monthInsights.ts";
import { formatDate } from "../../lib/dates.ts";
import { formatNumber } from "../../lib/format.ts";
import { BalanceChart, type BalanceReading } from "./BalanceChart.tsx";
import { signed } from "./chartScale.ts";
import { InsightCard } from "./InsightCard.tsx";
import { InsightNote } from "./InsightNote.tsx";
import { Legend } from "./Legend.tsx";
import { Readout } from "./Readout.tsx";
import styles from "./MonthGoalCard.module.css";

interface Props {
  month: MonthInsights;
  direction: -1 | 0 | 1;
}

const phaseChip = (month: MonthInsights, elapsed: number): string =>
  month.phase === "current" ? `Day ${elapsed} of ${month.days.length}` : month.phase === "past" ? "Finished" : "Not started";

/** The month's budget: how much of it is used, how that compares with an even pace, and the balance that carries over. */
export function MonthGoalCard({ month, direction }: Props) {
  const [reading, setReading] = useState<BalanceReading | null>(null);
  const note = balanceNote(month, direction);
  const elapsed = month.days.filter((d) => d.phase !== "future").length;
  const used = month.monthGoal > 0 ? month.eaten / month.monthGoal : 0;
  const pace = elapsed / month.days.length;

  const readout = reading ? (
    <Readout
      value={signed(reading.balance)}
      unit="kcal"
      caption={`${reading.balance >= 0 ? "Under" : "Over"} your goal ${reading.day === 0 ? "at the start of the month" : `at the end of ${formatDate(`${month.month}-${String(reading.day).padStart(2, "0")}`, { day: "numeric", month: "short" })}`}${reading.projected ? ", if you follow the suggestion" : ""}`}
    />
  ) : (
    <Readout value={formatNumber(month.eaten)} unit={`of ${formatNumber(month.monthGoal)} kcal`} caption={`${Math.round(used * 100)}% of this month's budget is eaten`} />
  );

  return (
    <InsightCard label="Month goal" tag={phaseChip(month, elapsed)} className={styles.card}>
      {readout}
      <div className={styles.meter} role="progressbar" aria-label="Month budget eaten" aria-valuemin={0} aria-valuemax={Math.round(month.monthGoal)} aria-valuenow={Math.round(month.eaten)}>
        <span className={styles.fill} style={{ width: `${Math.min(1, used) * 100}%` }} />
        {month.phase === "current" && <span className={styles.pace} style={{ left: `${pace * 100}%` }} title="Where an even pace would be by now" />}
      </div>
      <InsightNote note={note} />
      {month.series.length > 0 && (
        <>
          <BalanceChart month={month} onActive={setReading} />
          <Legend
            items={[
              { label: "Under your goal", swatch: "box", tone: "primary" },
              { label: "Over", swatch: "box", tone: "over" },
              ...(month.rebalance ? [{ label: "If you follow the suggestion", swatch: "dots" as const, tone: "ink" as const }] : []),
            ]}
          />
        </>
      )}
    </InsightCard>
  );
}
