import type { Targets } from "../../data/types.ts";
import { macroShares } from "../../domain/breakdowns.ts";
import type { MonthInsights } from "../../domain/monthInsights.ts";
import { formatNumber } from "../../lib/format.ts";
import { ProgressBar, type BarTone } from "../../ui/ProgressBar";
import { Donut } from "./Donut.tsx";
import { InsightCard } from "./InsightCard.tsx";
import styles from "./MacroCard.module.css";

interface Props {
  month: MonthInsights;
  targets: Targets;
}

const SPLIT = [
  { key: "protein", label: "Protein", color: "var(--viz-protein)" },
  { key: "carbs", label: "Carbs", color: "var(--viz-carbs)" },
  { key: "fat", label: "Fat", color: "var(--viz-fat)" },
] as const;

const GOALS: { key: "protein" | "carbs" | "fat" | "fiber"; label: string; tone: BarTone }[] = [
  { key: "protein", label: "Protein", tone: "protein" },
  { key: "carbs", label: "Carbs", tone: "carbs" },
  { key: "fat", label: "Fat", tone: "fat" },
  { key: "fiber", label: "Fiber", tone: "fiber" },
];

/** On an average day: where the calories come from (the ring), and how each nutrient stands against its goal (the bars). */
export function MacroCard({ month, targets }: Props) {
  const average = month.average;
  const shares = average ? macroShares(average) : null;

  return (
    <InsightCard label="Macros" tag="Average day">
      {!average || !shares ? (
        <p className={styles.empty}>Your macros show here once a full day is logged.</p>
      ) : (
        <>
          <div className={styles.split}>
            <Donut
              label={`Calories come ${SPLIT.map((s) => `${Math.round(shares[s.key] * 100)}% from ${s.label.toLowerCase()}`).join(", ")}`}
              slices={SPLIT.map((s) => ({ key: s.key, share: shares[s.key], color: s.color }))}
            >
              <span className={styles.kcal}>{formatNumber(average.calories)}</span>
              <span className={styles.unit}>kcal a day</span>
            </Donut>
            <ul className={styles.legend}>
              {SPLIT.map((s) => (
                <li key={s.key}>
                  <span className={styles.dot} style={{ background: s.color }} aria-hidden />
                  <span className={styles.name}>{s.label}</span>
                  <span className={styles.share}>{Math.round(shares[s.key] * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
          <ul className={styles.goals} aria-label="Against your goals">
            {GOALS.map(({ key, label, tone }) => {
              const eaten = average[key];
              const goal = targets[key];
              return (
                <li key={key}>
                  <div className={styles.line}>
                    <span className={styles.name}>{label}</span>
                    <span className={styles.amount}>{formatNumber(eaten)} <small>of {formatNumber(goal)} g</small></span>
                    <span className={styles.pct}>{Math.round((eaten / goal) * 100)}%</span>
                  </div>
                  <ProgressBar value={eaten} max={goal} tone={tone} size="sm" label={`${label} against its goal`} />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </InsightCard>
  );
}
