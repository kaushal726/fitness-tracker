import { SODIUM_LIMIT_MG, sugarLimitG, sugarSalt } from "../../domain/habits.ts";
import type { MonthInsights } from "../../domain/monthInsights.ts";
import { formatNumber } from "../../lib/format.ts";
import { ProgressBar } from "../../ui/ProgressBar";
import { InsightCard } from "./InsightCard.tsx";
import styles from "./SugarSaltCard.module.css";

interface Props {
  month: MonthInsights;
}

const days = (n: number): string => `${n} ${n === 1 ? "day" : "days"}`;

/** Sugar and salt on an average day against the usual advice, and on how many days each went over. */
export function SugarSaltCard({ month }: Props) {
  const r = sugarSalt(month.days, month.goal);
  const rows = r && [
    { key: "sugar", label: "Sugar", value: r.sugar, limit: sugarLimitG(month.goal), unit: "g", over: r.sugarDaysOver },
    { key: "sodium", label: "Salt (as sodium)", value: r.sodium, limit: SODIUM_LIMIT_MG, unit: "mg", over: r.sodiumDaysOver },
  ];

  return (
    <InsightCard label="Sugar and salt" tag="Average day">
      {!r || !rows ? (
        <p className={styles.empty}>Shows once a full day is logged.</p>
      ) : (
        <>
          <ul className={styles.list}>
            {rows.map((row) => (
              <li key={row.key}>
                <div className={styles.line}>
                  <span className={styles.name}>{row.label}</span>
                  <span className={styles.amount}>{formatNumber(row.value)} <small>of {formatNumber(row.limit)} {row.unit}</small></span>
                </div>
                <ProgressBar value={row.value} max={row.limit} tone={row.value > row.limit ? "over" : "primary"} size="sm" label={`${row.label} against the usual limit`} />
                <p className={styles.over}>{row.over === 0 ? "Under the limit every day" : `Over the limit on ${days(row.over)} of ${r.countedDays}`}</p>
              </li>
            ))}
          </ul>
          <p className={styles.foot}>The limits are the usual advice: sugar under 10% of your calories, sodium under 2,000 mg. The sugar counted is all of it, including fruit and milk, so a little over is normal.</p>
        </>
      )}
    </InsightCard>
  );
}
